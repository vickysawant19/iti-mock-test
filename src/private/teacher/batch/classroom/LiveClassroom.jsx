import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  Search,
  BookOpen,
  ClipboardList,
  Award,
  Sparkles,
  Calendar,
  Palmtree,
  Save,
  RefreshCw,
  Zap,
  Check,
  AlertCircle,
  Trash2,
  FileCheck,
  Radio,
} from "lucide-react";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SendAnnouncementModal from "@/components/notifications/SendAnnouncementModal";

export const LiveClassroom = ({ students = [], batchData }) => {
  const batchId = batchData?.$id || batchData?.id;
  const teamId = batchData?.teamId || batchId;
  const { onlineUsers } = useOnlineUsers(teamId);

  const todayFormattedDisplay = useMemo(() => format(new Date(), "EEEE, d MMMM yyyy"), []);
  const todayDateStr = useMemo(() => newAttendanceService.getTodayDate(), []);

  // UI Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [presenceFilter, setPresenceFilter] = useState("all"); // 'all', 'online', 'away', 'offline'
  const [attendanceFilter, setAttendanceFilter] = useState("all"); // 'all', 'present', 'absent', 'unmarked'

  // Attendance & Holiday State
  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const [existingDocIds, setExistingDocIds] = useState([]);
  
  // Holiday State (Batch Level)
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayDocId, setHolidayDocId] = useState(null);
  const [holidayText, setHolidayText] = useState("");
  const [isMarkingHolidayMode, setIsMarkingHolidayMode] = useState(false);

  // Status & Loading State
  const [isRecorded, setIsRecorded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Filter valid student list (exclude teachers if present)
  const actualStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    return students.filter((s) => !s.isTeacher && !s.role?.includes("Teacher"));
  }, [students]);

  // Load today's attendance and holiday records
  const loadTodayData = useCallback(async () => {
    if (!batchId) return;
    setIsLoading(true);
    try {
      const [attendanceRes, holidayRes] = await Promise.all([
        newAttendanceService.getBatchAttendanceByDate(batchId, todayDateStr).catch((err) => {
          console.error("Error fetching today's attendance:", err);
          return { documents: [], total: 0 };
        }),
        holidayService.getHolidayByDate(todayDateStr, batchId).catch((err) => {
          console.error("Error fetching today's holiday:", err);
          return null;
        }),
      ]);

      if (holidayRes) {
        setIsHoliday(true);
        setHolidayDocId(holidayRes.$id);
        setHolidayText(holidayRes.holidayText || "Batch Holiday");
        setIsRecorded(true);
        setAttendanceStatuses({});
        setExistingDocIds([]);
        setIsMarkingHolidayMode(false);
      } else if (attendanceRes && attendanceRes.documents && attendanceRes.documents.length > 0) {
        setIsHoliday(false);
        setHolidayDocId(null);
        setHolidayText("");
        setIsRecorded(true);
        setIsMarkingHolidayMode(false);

        const statusMap = {};
        const docIds = [];
        attendanceRes.documents.forEach((doc) => {
          if (doc.userId) {
            statusMap[doc.userId] = doc.status; // 'present' or 'absent'
            docIds.push(doc.$id);
          }
        });
        setAttendanceStatuses(statusMap);
        setExistingDocIds(docIds);
      } else {
        setIsHoliday(false);
        setHolidayDocId(null);
        setHolidayText("");
        setIsRecorded(false);
        setAttendanceStatuses({});
        setExistingDocIds([]);
        setIsMarkingHolidayMode(false);
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to load today's classroom data:", error);
      toast.error("Failed to load today's attendance records");
    } finally {
      setIsLoading(false);
    }
  }, [batchId, todayDateStr]);

  useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  // Enrich Student Roster with both Realtime Presence & Attendance Status
  const studentRoster = useMemo(() => {
    return actualStudents.map((student) => {
      const presence = onlineUsers.get(student.userId) || onlineUsers.get(student.$id);
      const liveStatus = presence?.status || "offline";
      const liveMeta = presence?.metadata || {};
      const attStatus = attendanceStatuses[student.userId] || "unmarked";

      return {
        ...student,
        presenceStatus: liveStatus,
        presenceMeta: liveMeta,
        attendanceStatus: attStatus,
      };
    });
  }, [actualStudents, onlineUsers, attendanceStatuses]);

  // Compute Overall Realtime & Attendance Statistics
  const stats = useMemo(() => {
    let onlineCount = 0;
    let awayCount = 0;
    let offlineCount = 0;
    let presentCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;

    const activityCounts = {
      "Mock Test": 0,
      Attendance: 0,
      Leaderboard: 0,
      Dashboard: 0,
    };

    studentRoster.forEach((s) => {
      // Realtime Stats
      if (s.presenceStatus === "online") {
        onlineCount++;
        const act = s.presenceMeta?.activity || "Dashboard";
        if (activityCounts[act] !== undefined) {
          activityCounts[act]++;
        } else {
          activityCounts.Dashboard++;
        }
      } else if (s.presenceStatus === "away") {
        awayCount++;
      } else {
        offlineCount++;
      }

      // Attendance Stats
      if (s.attendanceStatus === "present") presentCount++;
      else if (s.attendanceStatus === "absent") absentCount++;
      else unmarkedCount++;
    });

    const total = studentRoster.length;
    const markedCount = presentCount + absentCount;
    const percentage = total > 0 && markedCount > 0
      ? Math.round((presentCount / markedCount) * 100)
      : 0;

    return {
      total,
      onlineCount,
      awayCount,
      offlineCount,
      activityCounts,
      presentCount,
      absentCount,
      unmarkedCount,
      percentage,
    };
  }, [studentRoster]);

  // Single Student Attendance Toggle
  const handleStudentStatusChange = (userId, newStatus) => {
    setAttendanceStatuses((prev) => {
      const updated = { ...prev };
      if (updated[userId] === newStatus) {
        delete updated[userId]; // Deselect
      } else {
        updated[userId] = newStatus;
      }
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Quick Action: Mark All Present
  const markAllPresent = () => {
    const nextMap = {};
    actualStudents.forEach((student) => {
      nextMap[student.userId] = "present";
    });
    setAttendanceStatuses(nextMap);
    setIsMarkingHolidayMode(false);
    setHasUnsavedChanges(true);
    toast.info("Marked all students as Present");
  };

  // Quick Action: Mark All Absent
  const markAllAbsent = () => {
    const nextMap = {};
    actualStudents.forEach((student) => {
      nextMap[student.userId] = "absent";
    });
    setAttendanceStatuses(nextMap);
    setIsMarkingHolidayMode(false);
    setHasUnsavedChanges(true);
    toast.info("Marked all students as Absent");
  };

  // Quick Action: Reset Today's Attendance (deletes all attendance records for today from DB)
  const resetAttendance = async () => {
    if (!batchId) return;
    setIsSaving(true);
    try {
      // 1. Collect all today's attendance document IDs from state and database
      let docIdsToDelete = [...existingDocIds];
      const todayRecords = await newAttendanceService.getBatchAttendanceByDate(batchId, todayDateStr).catch(() => null);
      if (todayRecords?.documents?.length > 0) {
        const fetchedIds = todayRecords.documents.map((d) => d.$id);
        docIdsToDelete = Array.from(new Set([...docIdsToDelete, ...fetchedIds]));
      }

      // 2. Delete all attendance records for today from database
      if (docIdsToDelete.length > 0) {
        await newAttendanceService.deleteMultipleAttendance(docIdsToDelete);
      }

      // 3. Delete holiday document if active
      if (holidayDocId) {
        await holidayService.removeHoliday(holidayDocId).catch((err) =>
          console.error("Error removing holiday on reset:", err)
        );
        setHolidayDocId(null);
        setIsHoliday(false);
        setHolidayText("");
      }

      // 4. Reset UI state to clean unrecorded state
      setAttendanceStatuses({});
      setExistingDocIds([]);
      setIsRecorded(false);
      setIsMarkingHolidayMode(false);
      setHasUnsavedChanges(false);

      toast.success("Today's attendance records cleared & reset successfully!");
    } catch (error) {
      console.error("Error resetting attendance:", error);
      toast.error(`Failed to reset today's attendance: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Action: Toggle Batch Holiday Mode
  const toggleHolidayMode = () => {
    if (isHoliday) return;
    const nextState = !isMarkingHolidayMode;
    setIsMarkingHolidayMode(nextState);
    if (nextState && !holidayText) {
      setHolidayText("Batch Holiday");
    }
  };

  // Save Batch Holiday Action
  const handleSaveHoliday = async () => {
    if (!batchId) return;
    if (!holidayText.trim()) {
      toast.error("Please enter a reason for the batch holiday");
      return;
    }

    setIsSaving(true);
    try {
      if (existingDocIds.length > 0) {
        await newAttendanceService.deleteMultipleAttendance(existingDocIds).catch((err) =>
          console.error("Error clearing existing attendance docs for holiday:", err)
        );
      }

      const holidayRes = await holidayService.addHoliday({
        date: todayDateStr,
        batchId,
        holidayText: holidayText.trim(),
      });

      setIsHoliday(true);
      setHolidayDocId(holidayRes.$id);
      setIsRecorded(true);
      setIsMarkingHolidayMode(false);
      setAttendanceStatuses({});
      setExistingDocIds([]);
      setHasUnsavedChanges(false);

      toast.success("Today marked as Batch Holiday successfully!");
    } catch (error) {
      console.error("Error setting batch holiday:", error);
      toast.error(`Failed to set batch holiday: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Remove Batch Holiday Action
  const handleRemoveHoliday = async () => {
    if (!holidayDocId) return;
    setIsSaving(true);
    try {
      await holidayService.removeHoliday(holidayDocId);
      setIsHoliday(false);
      setHolidayDocId(null);
      setHolidayText("");
      setIsRecorded(false);
      setAttendanceStatuses({});
      setExistingDocIds([]);
      setIsMarkingHolidayMode(false);
      setHasUnsavedChanges(false);

      toast.success("Holiday removed! Attendance marking is now enabled.");
    } catch (error) {
      console.error("Error removing holiday:", error);
      toast.error("Failed to remove holiday");
    } finally {
      setIsSaving(false);
    }
  };

  // Save Normal Attendance (Present / Absent per student)
  const handleSaveAttendance = async () => {
    if (!batchId) {
      toast.error("Invalid batch context");
      return;
    }

    if (actualStudents.length === 0) {
      toast.error("No enrolled students to mark attendance for");
      return;
    }

    const selectedUserIds = Object.keys(attendanceStatuses).filter(
      (uid) => attendanceStatuses[uid] === "present" || attendanceStatuses[uid] === "absent"
    );

    if (selectedUserIds.length === 0) {
      toast.info("No attendance selected. Click 'Reset' if you want to clear today's attendance records.");
      return;
    }

    setIsSaving(true);
    try {
      if (holidayDocId) {
        await holidayService.removeHoliday(holidayDocId).catch((err) =>
          console.error("Error removing previous holiday doc:", err)
        );
        setHolidayDocId(null);
        setIsHoliday(false);
      }

      // Delete existing records for students who are no longer selected
      const currentTodayRecords = await newAttendanceService.getBatchAttendanceByDate(batchId, todayDateStr).catch(() => null);
      if (currentTodayRecords?.documents?.length > 0) {
        const idsToDelete = currentTodayRecords.documents
          .filter((doc) => !selectedUserIds.includes(doc.userId))
          .map((doc) => doc.$id);

        if (idsToDelete.length > 0) {
          await newAttendanceService.deleteMultipleAttendance(idsToDelete).catch((err) =>
            console.error("Error deleting deselected attendance docs:", err)
          );
        }
      }

      const recordsToSave = selectedUserIds.map((userId) => ({
        userId,
        batchId,
        tradeId: batchData?.tradeId || null,
        date: todayDateStr,
        status: attendanceStatuses[userId],
        markedAt: new Date().toISOString(),
        remarks: null,
      }));

      const response = await newAttendanceService.markBatchAttendance(batchId, todayDateStr, recordsToSave);

      const savedMap = {};
      const savedDocIds = [];
      if (response && response.success) {
        response.success.forEach((doc) => {
          savedMap[doc.userId] = doc.status;
          savedDocIds.push(doc.$id);
        });
      } else {
        recordsToSave.forEach((r) => {
          savedMap[r.userId] = r.status;
        });
      }

      setAttendanceStatuses(savedMap);
      setExistingDocIds(savedDocIds);
      setIsRecorded(true);
      setHasUnsavedChanges(false);

      toast.success("Today's attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(`Failed to save attendance: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Combined Multi-Filter for Roster
  const filteredRoster = useMemo(() => {
    return studentRoster.filter((student) => {
      // 1. Search term filter
      const nameMatch = (student.userName || student.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const rollMatch = (student.studentId || student.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!nameMatch && !rollMatch) return false;

      // 2. Realtime presence status filter
      if (presenceFilter !== "all" && student.presenceStatus !== presenceFilter) {
        return false;
      }

      // 3. Attendance status filter
      if (attendanceFilter !== "all" && student.attendanceStatus !== attendanceFilter) {
        return false;
      }

      return true;
    });
  }, [studentRoster, searchTerm, presenceFilter, attendanceFilter]);

  return (
    <div className="space-y-5">
      {/* ── UNIFIED COMMAND CENTER HEADER BAR ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Dark Navy / Indigo Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Today's Date & Live Status Badges */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 backdrop-blur-md flex-shrink-0">
                <Calendar className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Live Classroom & Attendance
                  </span>
                  {/* Attendance Status Badge */}
                  {isLoading ? (
                    <Badge variant="outline" className="bg-slate-800/80 text-slate-300 border-slate-700 text-[10px]">
                      Loading...
                    </Badge>
                  ) : isHoliday ? (
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] gap-1">
                      <Palmtree className="h-3 w-3" /> Batch Holiday
                    </Badge>
                  ) : isRecorded ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] gap-1">
                      <FileCheck className="h-3 w-3" /> Attendance Recorded
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] gap-1 animate-pulse">
                      <AlertCircle className="h-3 w-3" /> Not Marked Today
                    </Badge>
                  )}

                  {/* Realtime Live Online Badge */}
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {stats.onlineCount} Active Now
                  </Badge>
                </div>

                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                  {todayFormattedDisplay}
                </h3>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              {hasUnsavedChanges && !isHoliday && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse mr-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Unsaved changes
                </span>
              )}

              {/* Send Announcement Trigger */}
              <SendAnnouncementModal customBatch={batchData} />

              {/* Save Attendance Trigger */}
              {!isHoliday && (
                <Button
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                  size="sm"
                  className={`h-9 px-4 font-semibold text-xs transition-all shadow-md ${
                    hasUnsavedChanges
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white animate-pulse"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="mr-1.5 h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-4 w-4" />
                      Save Attendance
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* ── UNIFIED METRICS & ACTIVE TASKS BREAKDOWN STRIP ── */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 pt-3 border-t border-white/10">
            {/* Total Students */}
            <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <span>Enrolled</span>
                <Users className="h-3.5 w-3.5 text-indigo-300" />
              </div>
              <p className="mt-1 text-base sm:text-lg font-bold text-white">{stats.total}</p>
            </div>

            {/* Present (Attendance) */}
            <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300">
                <span>Present Today</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="mt-1 text-base sm:text-lg font-bold text-emerald-300">{stats.presentCount}</p>
            </div>

            {/* Absent (Attendance) */}
            <div className="rounded-xl bg-rose-500/10 p-2.5 border border-rose-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-rose-300">
                <span>Absent Today</span>
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
              </div>
              <p className="mt-1 text-base sm:text-lg font-bold text-rose-300">{stats.absentCount}</p>
            </div>

            {/* Online Live */}
            <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300">
                <span>Online Now</span>
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="mt-1 text-base sm:text-lg font-bold text-emerald-300">
                {stats.onlineCount}{" "}
                <span className="text-[10px] text-emerald-400/80 font-normal">
                  ({stats.total > 0 ? Math.round((stats.onlineCount / stats.total) * 100) : 0}%)
                </span>
              </p>
            </div>

            {/* Away / Offline Live */}
            <div className="rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-amber-300">
                <span>Away / Offline</span>
                <Clock className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="mt-1 text-base sm:text-lg font-bold text-amber-300">
                {stats.awayCount} <span className="text-[10px] text-slate-400 font-normal">away</span> · {stats.offlineCount} <span className="text-[10px] text-slate-400 font-normal">off</span>
              </p>
            </div>

            {/* Attendance Percentage */}
            <div className="col-span-2 sm:col-span-1 rounded-xl bg-indigo-500/10 p-2.5 border border-indigo-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-indigo-300">
                <span>Attendance %</span>
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-base sm:text-lg font-bold text-indigo-200">{stats.percentage}%</span>
                <div className="w-12 bg-white/20 rounded-full h-2 overflow-hidden ml-1.5">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, stats.percentage))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── ACTIVE TASKS BREAKDOWN STRIP ── */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs text-slate-300">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Active Tasks Breakdown:
            </span>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-400/30 text-[11px]">
              <BookOpen className="mr-1 h-3 w-3" />
              Mock Test: {stats.activityCounts["Mock Test"]}
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-400/30 text-[11px]">
              <ClipboardList className="mr-1 h-3 w-3" />
              Attendance: {stats.activityCounts["Attendance"]}
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-400/30 text-[11px]">
              <Award className="mr-1 h-3 w-3" />
              Leaderboard: {stats.activityCounts["Leaderboard"]}
            </Badge>
          </div>
        </div>

        {/* ── WORKSPACE AREA ── */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* ── VIEW 1: BATCH HOLIDAY ACTIVE ── */}
          {isHoliday ? (
            <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl border-2 border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="h-16 w-16 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center mb-3 shadow-inner">
                <Palmtree className="h-9 w-9" />
              </div>
              <h4 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                Batch Holiday Marked
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 max-w-md mt-1 mb-3">
                This date is set as a holiday for the whole batch. All students are exempted from attendance today.
              </p>

              {holidayText && (
                <div className="px-4 py-2 rounded-lg bg-white border border-amber-200 dark:bg-slate-900 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold mb-5 shadow-sm">
                  Reason: "{holidayText}"
                </div>
              )}

              <Button
                onClick={handleRemoveHoliday}
                disabled={isSaving}
                variant="outline"
                className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs h-9"
              >
                {isSaving ? (
                  <>
                    <div className="mr-1.5 h-3.5 w-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-1.5 h-4 w-4 text-rose-600 dark:text-rose-400" />
                    Remove Holiday & Enable Attendance
                  </>
                )}
              </Button>
            </div>
          ) : isMarkingHolidayMode ? (
            /* ── VIEW 2: MARK BATCH HOLIDAY FORM ── */
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300 flex items-center justify-center mb-3">
                <Palmtree className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                Mark Entire Day as Batch Holiday
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm text-center mb-4">
                This will declare today as a holiday for the whole batch and clear existing student attendance records for today.
              </p>

              <div className="w-full max-w-md space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Holiday Reason / Title
                  </label>
                  <Input
                    value={holidayText}
                    onChange={(e) => setHolidayText(e.target.value)}
                    placeholder="e.g. Festival, Heavy Rain, Local Holiday"
                    className="text-xs bg-white dark:bg-slate-900"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    onClick={() => setIsMarkingHolidayMode(false)}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveHoliday}
                    disabled={isSaving}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 px-4"
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-1.5 h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving Holiday...
                      </>
                    ) : (
                      <>
                        <Palmtree className="mr-1.5 h-4 w-4" />
                        Confirm & Save Batch Holiday
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ── VIEW 3: UNIFIED STUDENT ROSTER & ATTENDANCE WORKSPACE ── */
            <>
              {/* Quick Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1 hidden sm:inline">
                    Quick Actions:
                  </span>
                  <Button
                    onClick={markAllPresent}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    <Check className="mr-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Mark All Present
                  </Button>
                  <Button
                    onClick={markAllAbsent}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                  >
                    <UserX className="mr-1 h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    Mark All Absent
                  </Button>
                  <Button
                    onClick={toggleHolidayMode}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  >
                    <Palmtree className="mr-1 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    Mark Entire Day as Holiday
                  </Button>
                  <Button
                    onClick={resetAttendance}
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Unified Controls & Filters Bar */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pt-1">
                {/* Multi-Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Realtime Status Filter */}
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/80 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Live:</span>
                    {[
                      { id: "all", label: `All (${studentRoster.length})` },
                      { id: "online", label: `Online (${stats.onlineCount})` },
                      { id: "away", label: `Away (${stats.awayCount})` },
                      { id: "offline", label: `Offline (${stats.offlineCount})` },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setPresenceFilter(item.id)}
                        className={`rounded-md px-2 py-1 font-medium transition-all ${
                          presenceFilter === item.id
                            ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Attendance Filter */}
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/80 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Att:</span>
                    {[
                      { id: "all", label: `All` },
                      { id: "present", label: `Present (${stats.presentCount})` },
                      { id: "absent", label: `Absent (${stats.absentCount})` },
                      { id: "unmarked", label: `Not Marked (${stats.unmarkedCount})` },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setAttendanceFilter(item.id)}
                        className={`rounded-md px-2 py-1 font-medium transition-all ${
                          attendanceFilter === item.id
                            ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search student or roll no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
              </div>

              {/* ── UNIFIED STUDENT ROSTER CARDS GRID (MOBILE RESPONSIVE) ── */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <div className="h-7 w-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-medium">Synchronizing live classroom & attendance...</span>
                </div>
              ) : filteredRoster.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredRoster.map((student) => {
                    const presence = student.presenceStatus;
                    const activity = student.presenceMeta?.activity || "Dashboard";
                    const attStatus = student.attendanceStatus;
                    const lastSeenTime =
                      student.presenceMeta?.lastSeen ||
                      student.presenceMeta?.lastActivity ||
                      student.lastseen;
                    
                    const getLastSeenText = () => {
                      if (!lastSeenTime) return "Never active";
                      try {
                        const d = new Date(lastSeenTime);
                        if (isNaN(d.getTime())) return "Never active";
                        return formatDistanceToNow(d, { addSuffix: true });
                      } catch {
                        return "Never active";
                      }
                    };

                    return (
                      <div
                        key={student.userId || student.$id}
                        className={`flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200 shadow-sm ${
                          attStatus === "present"
                            ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                            : attStatus === "absent"
                            ? "bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50"
                            : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800"
                        }`}
                      >
                        {/* Student Header info */}
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <InteractiveAvatar
                              src={student.profileImage}
                              fallbackText={
                                student.userName
                                  ? student.userName.charAt(0).toUpperCase()
                                  : "S"
                              }
                              userId={student.userId}
                              userName={student.userName || student.name}
                              lastseen={lastSeenTime}
                              showStatus={true}
                              editable={false}
                              className="h-11 w-11 border border-slate-200 dark:border-slate-700"
                            />
                            {/* Live Presence indicator dot */}
                            <span
                              title={`Live status: ${presence}`}
                              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                                presence === "online"
                                  ? "bg-emerald-500"
                                  : presence === "away"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {student.userName || student.name || "Student"}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-mono flex-shrink-0"
                              >
                                Roll: {student.studentId || student.rollNumber || "NA"}
                              </Badge>
                            </div>

                            {/* Live Status & Last Active Time */}
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
                              <span
                                className={`font-semibold capitalize ${
                                  presence === "online"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : presence === "away"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-slate-400"
                                }`}
                              >
                                {presence}
                              </span>
                              {presence === "online" ? (
                                <span className="text-slate-400 dark:text-slate-500">
                                  · {activity}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 truncate" title={`Last active: ${lastSeenTime ? new Date(lastSeenTime).toLocaleString() : "N/A"}`}>
                                  · Last active {getLastSeenText()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 1-Tap Attendance Toggle Buttons */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
                          {/* ✅ Present Button */}
                          <button
                            type="button"
                            onClick={() => handleStudentStatusChange(student.userId, "present")}
                            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              attStatus === "present"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600/20 dark:bg-emerald-600"
                                : "bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Present</span>
                          </button>

                          {/* ❌ Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleStudentStatusChange(student.userId, "absent")}
                            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              attStatus === "absent"
                                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600/20 dark:bg-rose-600"
                                : "bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-300"
                            }`}
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Users className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No matching students found
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Try adjusting your search term, presence, or attendance filters.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClassroom;
