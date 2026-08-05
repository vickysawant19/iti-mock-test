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
import { attendanceTrackingService } from "@/services/attendanceTrackingService";

export function useDailyDiaryActions({
  onRefreshData,
  batchData,
  attendance,
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
        enrichedStudents = (profiles || []).map((p) => {
          const m = memberMap.get(p.userId);
          return {
            ...p,
            rollNumber: m?.rollNumber || "",
          };
        });
      }

      if (profile?.userId) {
        const teacherExists = enrichedStudents.some(
          (s) => s.userId === profile.userId
        );
        if (!teacherExists) {
          enrichedStudents.unshift({
            $id: profile.$id || profile.userId,
            userId: profile.userId,
            userName: profile.userName || profile.name || "Teacher (You)",
            profileImage: profile.profileImage,
            rollNumber: "INSTRUCTOR",
            isTeacherRole: true,
          });
        }
      }

      return enrichedStudents;
    } catch (error) {
      console.error("Error loading batch students:", error);
      toast.error("Failed to load students");
      return [];
    }
  }, [activeBatchId, profile]);

  const openAttendanceModal = useCallback(
    async (dateStr, mode = "attendance") => {
      setModalDate(dateStr);
      setModalMode(mode);
      setIsModalOpen(true);
      setIsLoadingModalData(true);

      try {
        const [studentList, attendanceRes] = await Promise.all([
          loadStudents(),
          newAttendanceService.getBatchAttendanceByDate(
            activeBatchId,
            dateStr,
            [Query.limit(100)]
          ),
        ]);
        setStudents(studentList);
        setExistingAttendance(attendanceRes?.documents || []);
      } catch (error) {
        console.error("Error opening modal:", error);
        toast.error("Failed to load modal data");
      } finally {
        setIsLoadingModalData(false);
      }
    },
    [activeBatchId, loadStudents]
  );

  const closeAttendanceModal = useCallback(() => {
    setIsModalOpen(false);
    setModalDate(null);
    setStudents([]);
    setExistingAttendance([]);
  }, []);

  const handleSaveAttendance = useCallback(async () => {
    toast.success("Attendance saved successfully");
    closeAttendanceModal();
    if (onRefreshData) onRefreshData(false);
  }, [closeAttendanceModal, onRefreshData]);

  const handleDeleteTeacherAttendance = useCallback(
    async (dateStr) => {
      if (!profile?.userId || !activeBatchId) return;

      let docId = attendanceDocIds?.get?.(dateStr) || attendanceDocIds?.[dateStr];
      if (!docId) {
        toast.error("No attendance record found to delete");
        return;
      }

      setActionLoadingDates((prev) => ({ ...prev, [dateStr]: "deleting" }));
      try {
        await newAttendanceService.deleteAttendance(docId);
        if (onTeacherAttendanceUpdate) onTeacherAttendanceUpdate(dateStr, null);
        if (updateAttendanceDocId) updateAttendanceDocId(dateStr, null);
        toast.success("Attendance deleted successfully");
      } catch (error) {
        console.error("Error deleting teacher attendance:", error);
        toast.error("Failed to delete attendance");
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
      attendanceDocIds,
      onTeacherAttendanceUpdate,
      updateAttendanceDocId,
    ]
  );

  const handleAddHoliday = useCallback(
    async (dateStr, holidayText) => {
      if (!activeBatchId) return;
      try {
        // First add the holiday
        await holidayService.addHoliday({
          batchId: activeBatchId,
          date: dateStr,
          holidayText,
        });

        // Then delete ALL attendance records for that date in the batch (students + teacher)
        try {
          const batchAttendanceRes = await newAttendanceService.getBatchAttendanceByDate(
            activeBatchId,
            dateStr,
            []
          );
          const docIds = (batchAttendanceRes?.documents || []).map((d) => d.$id).filter(Boolean);
          if (docIds.length > 0) {
            await newAttendanceService.deleteMultipleAttendance(docIds);
          }
        } catch (cleanupError) {
          console.error("Warning: could not clear attendance for holiday date:", cleanupError);
        }

        toast.success("Holiday added and attendance cleared for this date");
        if (onRefreshData) onRefreshData(false);
      } catch (error) {
        console.error("Error adding holiday:", error);
        toast.error("Failed to add holiday");
      }
    },
    [activeBatchId, onRefreshData]
  );

  const handleRemoveHoliday = useCallback(
    async (dateStr, holidaysMap) => {
      const holidayObj = holidaysMap.get(dateStr);
      if (!holidayObj || !holidayObj.$id) return;

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

  const handleSetTeacherAttendance = useCallback(
    async (dateStr, targetStatus) => {
      if (!profile?.userId || !activeBatchId) return;

      const currentStatus = attendance?.get?.(dateStr) || attendance?.[dateStr];
      if (currentStatus === targetStatus) {
        return;
      }

      if (onTeacherAttendanceUpdate) {
        onTeacherAttendanceUpdate(dateStr, targetStatus);
      }

      setActionLoadingDates((prev) => ({ ...prev, [dateStr]: targetStatus }));

      try {
        let docId = attendanceDocIds?.get?.(dateStr) || attendanceDocIds?.[dateStr];

        const { attendanceStatus, leaveType } = attendanceTrackingService.resolveStatusPair(targetStatus);
        const finalStatus = leaveType ? leaveType.toLowerCase() : targetStatus.toLowerCase();

        if (docId) {
          await newAttendanceService.updateAttendance(docId, {
            status: finalStatus,
            attendanceStatus,
            leaveType,
          });
        } else {
          const newDoc = await newAttendanceService.createAttendance({
            userId: profile.userId,
            batchId: activeBatchId,
            tradeId: batchData?.tradeId ?? null,
            date: dateStr,
            status: finalStatus,
            attendanceStatus,
            leaveType,
            remarks: null,
            skipStats: true,
          });
          if (newDoc?.$id && updateAttendanceDocId) {
            updateAttendanceDocId(dateStr, newDoc.$id);
          }
        }

        const config = attendanceTrackingService.getStatusConfig(targetStatus);
        toast.success(`Teacher attendance marked as ${config.label || targetStatus}`);
      } catch (error) {
        console.error("Error updating teacher attendance:", error);
        toast.error("Failed to update teacher attendance");
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
      batchData?.tradeId,
      attendance,
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
    handleDeleteTeacherAttendance,
  };
}
