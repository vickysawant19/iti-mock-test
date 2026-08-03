import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Query } from "appwrite";

import { selectProfile } from "@/store/profileSlice";
import { selectActiveBatchId } from "@/store/activeBatchSlice";
import batchStudentService from "@/appwrite/batchStudentService";
import userProfileService from "@/appwrite/userProfileService";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";

export function useDailyDiaryActions({
  onRefreshData,
  batchData,
  attendanceDocIds,
  onTeacherAttendanceUpdate,
  updateAttendanceDocId,
} = {}) {
  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector(selectActiveBatchId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalMode, setModalMode] = useState("attendance");
  const [students, setStudents] = useState([]);
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);

  // Load batch students with teacher prepended
  const loadStudents = useCallback(async () => {
    if (!activeBatchId) return [];
    try {
      const batchMembers = await batchStudentService.getBatchStudents(activeBatchId);
      const memberMap = new Map();
      const studentIds = [];

      (batchMembers || []).forEach((member) => {
        if (member.studentId) {
          memberMap.set(member.studentId, member);
          studentIds.push(member.studentId);
        }
      });

      let enrichedStudents = [];
      if (studentIds.length > 0) {
        const profiles = await userProfileService.getBatchUserProfile([
          Query.equal("userId", studentIds),
          Query.select(["$id", "userId", "userName", "profileImage"]),
          Query.limit(100),
        ]);

        enrichedStudents = (profiles || [])
          .map((p) => ({
            ...p,
            studentId: memberMap.get(p.userId)?.rollNumber ?? null,
          }))
          .sort((a, b) => {
            const valA = a.studentId ? parseInt(a.studentId, 10) : Infinity;
            const valB = b.studentId ? parseInt(b.studentId, 10) : Infinity;
            return valA - valB;
          });
      }

      // Prepend teacher row
      const teacherRow = {
        $id: profile?.$id || profile?.userId,
        userId: profile?.userId,
        userName: `${profile?.userName || profile?.name || "Instructor"} - Teacher`,
        studentId: "Teacher",
        profileImage: profile?.profileImage || "",
        isTeacher: true,
      };

      return [teacherRow, ...enrichedStudents];
    } catch (err) {
      console.error("Error loading students for attendance modal:", err);
      toast.error("Failed to load students list");
      return [];
    }
  }, [activeBatchId, profile]);

  // Open modal for a specific date with mode ('attendance' | 'holiday')
  const openAttendanceModal = useCallback(
    async (dateStr, mode = "attendance") => {
      setModalDate(dateStr);
      setModalMode(mode);
      setIsModalOpen(true);
      setIsLoadingModalData(true);

      try {
        const [studentList, attRes] = await Promise.all([
          students.length > 0 ? Promise.resolve(students) : loadStudents(),
          newAttendanceService.getBatchAttendanceByDate(activeBatchId, dateStr),
        ]);

        if (studentList && studentList.length > 0) {
          setStudents(studentList);
        }
        setExistingAttendance(attRes?.documents || []);
      } catch (error) {
        console.error("Error opening attendance modal:", error);
        toast.error("Failed to load attendance details");
      } finally {
        setIsLoadingModalData(false);
      }
    },
    [activeBatchId, loadStudents, students]
  );

  const closeAttendanceModal = useCallback(() => {
    setIsModalOpen(false);
    setModalDate(null);
    setModalMode("attendance");
  }, []);

  // Save attendance for batch from modal
  const handleSaveAttendance = useCallback(
    async (statuses) => {
      if (!activeBatchId || !modalDate) return;
      try {
        const records = Object.entries(statuses).map(([userId, status]) => ({
          userId,
          batchId: activeBatchId,
          tradeId: batchData?.tradeId ?? null,
          date: modalDate,
          status,
          marketAt: new Date().toISOString(),
          remarks: null,
        }));

        await newAttendanceService.markBatchAttendance(activeBatchId, modalDate, records);
        toast.success("Attendance saved successfully");
        if (onRefreshData) onRefreshData(false);
      } catch (error) {
        console.error("Error saving attendance:", error);
        toast.error("Failed to save attendance");
      }
    },
    [activeBatchId, modalDate, batchData, onRefreshData]
  );

  // Set day as holiday
  const handleAddHoliday = useCallback(
    async (dateStr, holidayReason) => {
      if (!activeBatchId) return;
      try {
        // Delete existing attendance records for date if any
        const attRes = await newAttendanceService.getBatchAttendanceByDate(activeBatchId, dateStr);
        const idsToDelete = (attRes?.documents || []).map((doc) => doc.$id);
        if (idsToDelete.length > 0) {
          await newAttendanceService.deleteMultipleAttendance(idsToDelete);
        }

        await holidayService.addHoliday({
          date: dateStr,
          batchId: activeBatchId,
          holidayText: holidayReason,
        });

        toast.success("Holiday set successfully");
        if (onRefreshData) onRefreshData(false);
      } catch (error) {
        console.error("Error adding holiday:", error);
        toast.error("Failed to set holiday");
      }
    },
    [activeBatchId, onRefreshData]
  );

  // Remove holiday
  const handleRemoveHoliday = useCallback(
    async (dateStr, holidaysMap) => {
      const holidayObj = holidaysMap instanceof Map ? holidaysMap.get(dateStr) : holidaysMap?.[dateStr];
      if (!holidayObj?.$id) {
        toast.error("Holiday record not found");
        return;
      }
      try {
        await holidayService.removeHoliday(holidayObj.$id);
        toast.success("Holiday removed successfully");
        if (onRefreshData) onRefreshData(false);
      } catch (error) {
        console.error("Error removing holiday:", error);
        toast.error("Failed to remove holiday");
      }
    },
    [onRefreshData]
  );

  const [actionLoadingDates, setActionLoadingDates] = useState({});

  // Direct Teacher Attendance setter (Present or Absent)
  const handleSetTeacherAttendance = useCallback(
    async (dateStr, targetStatus) => {
      if (!profile?.userId || !activeBatchId) return;

      // 1. Optimistic local state update (0ms latency!)
      if (onTeacherAttendanceUpdate) {
        onTeacherAttendanceUpdate(dateStr, targetStatus);
      }

      setActionLoadingDates((prev) => ({ ...prev, [dateStr]: targetStatus }));

      try {
        // 2. Check in-memory cache for document $id to avoid preliminary DB listRows query
        let docId = attendanceDocIds?.get?.(dateStr) || attendanceDocIds?.[dateStr];

        if (!docId) {
          const existingRecord = await newAttendanceService.getAttendanceByDate(
            profile.userId,
            activeBatchId,
            dateStr
          );
          docId = existingRecord?.$id;
        }

        if (docId) {
          await newAttendanceService.updateAttendance(docId, {
            status: targetStatus,
          });
          if (updateAttendanceDocId) {
            updateAttendanceDocId(dateStr, docId);
          }
        } else {
          const newDoc = await newAttendanceService.createAttendance({
            userId: profile.userId,
            batchId: activeBatchId,
            tradeId: batchData?.tradeId ?? null,
            date: dateStr,
            status: targetStatus,
            remarks: null,
            skipStats: true,
          });
          if (newDoc?.$id && updateAttendanceDocId) {
            updateAttendanceDocId(dateStr, newDoc.$id);
          }
        }

        toast.success(`Teacher attendance marked as ${targetStatus}`);
        // NOTE: Local state is ALREADY updated optimistically, so no 4-query re-fetch is needed!
      } catch (error) {
        console.error("Error updating teacher attendance:", error);
        toast.error("Failed to update teacher attendance");
        // Re-fetch only on error to sync clean state
        if (onRefreshData) onRefreshData(false);
      } finally {
        setActionLoadingDates((prev) => {
          const next = { ...prev };
          delete next[dateStr];
          return next;
        });
      }
    },
    [
      profile?.userId,
      activeBatchId,
      batchData,
      attendanceDocIds,
      onTeacherAttendanceUpdate,
      updateAttendanceDocId,
      onRefreshData,
    ]
  );

  return {
    isModalOpen,
    modalDate,
    modalMode,
    students,
    existingAttendance,
    isLoadingModalData,
    actionLoadingDates,
    openAttendanceModal,
    closeAttendanceModal,
    handleSaveAttendance,
    handleAddHoliday,
    handleRemoveHoliday,
    handleSetTeacherAttendance,
  };
}
