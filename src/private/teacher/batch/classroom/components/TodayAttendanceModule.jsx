import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Palmtree,
  RefreshCw,
  Save,
  Search,
  Users,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  UserX,
  FileCheck,
  Zap,
  Trash2,
} from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const TodayAttendanceModule = ({ students = [], batchData, onlineUsersMap }) => {
  const batchId = batchData?.$id || batchData?.id;
  const todayFormattedDisplay = useMemo(() => format(new Date(), "EEEE, d MMMM yyyy"), []);
  const todayDateStr = useMemo(() => newAttendanceService.getTodayDate(), []);

  // UI State
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'present', 'absent', 'unmarked'

  // Data & Status State
  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const [existingDocIds, setExistingDocIds] = useState([]);
  
  // Holiday State (Batch Level)
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayDocId, setHolidayDocId] = useState(null);
  const [holidayText, setHolidayText] = useState("");
  const [isMarkingHolidayMode, setIsMarkingHolidayMode] = useState(false);

  // Loading & Operations State
  const [isRecorded, setIsRecorded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Filter valid student list (exclude teachers)
  const actualStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    return students.filter((s) => !s.isTeacher && !s.role?.includes("Teacher"));
  }, [students]);

  // Load today's attendance and holiday info from Appwrite
  const loadTodayAttendance = useCallback(async () => {
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
        // Today is a Batch Holiday
        setIsHoliday(true);
        setHolidayDocId(holidayRes.$id);
        setHolidayText(holidayRes.holidayText || "Batch Holiday");
        setIsRecorded(true);
        setAttendanceStatuses({});
        setExistingDocIds([]);
        setIsMarkingHolidayMode(false);
      } else if (attendanceRes && attendanceRes.documents && attendanceRes.documents.length > 0) {
        // Attendance already recorded for today
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
        // Attendance not marked yet for today
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
      console.error("Failed to load today's attendance:", error);
      toast.error("Failed to load today's attendance records");
    } finally {
      setIsLoading(false);
    }
  }, [batchId, todayDateStr]);

  useEffect(() => {
    loadTodayAttendance();
  }, [loadTodayAttendance]);

  // Live Statistics calculation
  const stats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;

    actualStudents.forEach((student) => {
      const st = attendanceStatuses[student.userId];
      if (st === "present") presentCount++;
      else if (st === "absent") absentCount++;
      else unmarkedCount++;
    });

    const total = actualStudents.length;
    const markedCount = presentCount + absentCount;
    const percentage = total > 0 && markedCount > 0
      ? Math.round((presentCount / markedCount) * 100)
      : 0;

    return {
      total,
      presentCount,
      absentCount,
      unmarkedCount,
      percentage,
      isFullyMarked: total > 0 && unmarkedCount === 0,
    };
  }, [actualStudents, attendanceStatuses]);

  // Handle single student status toggle (Present vs Absent)
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

  // Quick Actions: Mark All Present
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

  // Quick Actions: Mark All Absent
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

  // Quick Actions: Reset Selections
  const resetAttendance = () => {
    setAttendanceStatuses({});
    setIsMarkingHolidayMode(false);
    setHasUnsavedChanges(true);
    toast.info("Reset today's attendance selections");
  };

  // Quick Actions: Toggle Batch Holiday Mode
  const toggleHolidayMode = () => {
    if (isHoliday) return; // If already a saved holiday, user should use "Remove Holiday"
    const nextState = !isMarkingHolidayMode;
    setIsMarkingHolidayMode(nextState);
    if (nextState && !holidayText) {
      setHolidayText("Batch Holiday");
    }
  };

  // Save Batch Holiday Action (deletes student records & adds holiday document)
  const handleSaveHoliday = async () => {
    if (!batchId) return;
    if (!holidayText.trim()) {
      toast.error("Please enter a reason for the batch holiday");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Delete any existing attendance records for today first
      if (existingDocIds.length > 0) {
        const deletedIds = await newAttendanceService.deleteMultipleAttendance(existingDocIds);
        if (deletedIds.length !== existingDocIds.length) {
          console.warn("Partial deletion occurred during holiday marking");
        }
      }

      // 2. Add holiday entry for the whole batch
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

      toast.success("Today marked as Batch Holiday and attendance cleared successfully!");
    } catch (error) {
      console.error("Error setting batch holiday:", error);
      toast.error(`Failed to set batch holiday: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Remove Batch Holiday Action (deletes holiday document & opens normal marking)
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

      toast.success("Holiday removed successfully! You can now mark today's attendance.");
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

    setIsSaving(true);
    try {
      // If a holiday was previously active, remove it first
      if (holidayDocId) {
        await holidayService.removeHoliday(holidayDocId).catch((err) =>
          console.error("Error removing previous holiday doc:", err)
        );
        setHolidayDocId(null);
        setIsHoliday(false);
      }

      const recordsToSave = actualStudents.map((student) => ({
        userId: student.userId,
        batchId,
        tradeId: batchData?.tradeId || null,
        date: todayDateStr,
        status: attendanceStatuses[student.userId] || "absent", // Default unselected to absent
        markedAt: new Date().toISOString(),
        remarks: null,
      }));

      const response = await newAttendanceService.markBatchAttendance(batchId, todayDateStr, recordsToSave);

      // Update local state with saved document IDs and statuses
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

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return actualStudents.filter((student) => {
      const name = student.userName || student.name || "";
      const roll = student.studentId || student.rollNumber || "";
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roll.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const st = attendanceStatuses[student.userId] || "unmarked";
      if (statusFilter === "present" && st !== "present") return false;
      if (statusFilter === "absent" && st !== "absent") return false;
      if (statusFilter === "unmarked" && st !== "unmarked") return false;

      return true;
    });
  }, [actualStudents, searchTerm, statusFilter, attendanceStatuses]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* ── STICKY / TOP HEADER BAR ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Header info & Today's Date */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 backdrop-blur-md">
              <Calendar className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Today's Attendance
                </span>
                {/* Live Recorded / Pending Badge */}
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
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                {todayFormattedDisplay}
              </h3>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {hasUnsavedChanges && !isHoliday && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse mr-2">
                <AlertCircle className="h-3.5 w-3.5" /> Unsaved changes
              </span>
            )}
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white text-xs h-9"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" /> Collapse Panel
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1 text-amber-400" />
                  {isHoliday ? "View Holiday Info" : isRecorded ? "Edit Today's Attendance" : "Mark Today's Attendance"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── LIVE QUICK STATISTICS BAR (Shown when NOT a Holiday) ── */}
        {!isHoliday ? (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5 pt-3 border-t border-white/10">
            {/* Total Enrolled */}
            <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <span>Total Students</span>
                <Users className="h-3.5 w-3.5 text-indigo-300" />
              </div>
              <p className="mt-1 text-lg font-bold text-white">{stats.total}</p>
            </div>

            {/* Present */}
            <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300">
                <span>Present</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="mt-1 text-lg font-bold text-emerald-300">{stats.presentCount}</p>
            </div>

            {/* Absent */}
            <div className="rounded-xl bg-rose-500/10 p-2.5 border border-rose-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-rose-300">
                <span>Absent</span>
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
              </div>
              <p className="mt-1 text-lg font-bold text-rose-300">{stats.absentCount}</p>
            </div>

            {/* Not Marked */}
            <div className="rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-amber-300">
                <span>Not Marked</span>
                <Clock className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="mt-1 text-lg font-bold text-amber-300">{stats.unmarkedCount}</p>
            </div>

            {/* Attendance Percentage */}
            <div className="col-span-2 sm:col-span-1 rounded-xl bg-indigo-500/10 p-2.5 border border-indigo-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-indigo-300">
                <span>Attendance %</span>
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-lg font-bold text-indigo-200">{stats.percentage}%</span>
                <div className="w-14 bg-white/20 rounded-full h-2 overflow-hidden ml-2">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, stats.percentage))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* BATCH HOLIDAY HEADER STATS STRIP */
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 text-xs">
              <Palmtree className="h-4 w-4 text-amber-400" />
              <span>Today is marked as a <strong>Batch Holiday</strong>: "{holidayText}"</span>
            </div>
            <span className="text-xs text-amber-200/80 font-mono">All {actualStudents.length} Students Exempted</span>
          </div>
        )}
      </div>

      {/* ── EXPANDABLE WORKSPACE ── */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* ── VIEW 1: BATCH HOLIDAY IS ACTIVE ── */}
          {isHoliday ? (
            <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl border-2 border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="h-16 w-16 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center mb-3 shadow-inner">
                <Palmtree className="h-9 w-9" />
              </div>
              <h4 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                Batch Holiday Marked
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 max-w-md mt-1 mb-3">
                This date is officially set as a holiday for the whole batch. All students are exempted from attendance on this day.
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
            /* ── VIEW 2: SET BATCH HOLIDAY MODE FORM ── */
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300 flex items-center justify-center mb-3">
                <Palmtree className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                Mark Entire Day as Batch Holiday
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm text-center mb-4">
                This will declare today as a holiday for the whole batch and clear any existing student attendance records for today.
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
            /* ── VIEW 3: NORMAL STUDENT ATTENDANCE WORKSPACE ── */
            <>
              {/* Quick Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1 hidden sm:inline">
                    Quick Actions:
                  </span>
                  <Button
                    onClick={markAllPresent}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/60"
                  >
                    <Check className="mr-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Mark All Present
                  </Button>
                  <Button
                    onClick={markAllAbsent}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/60"
                  >
                    <UserX className="mr-1 h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    Mark All Absent
                  </Button>
                  <Button
                    onClick={toggleHolidayMode}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/60"
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

                {/* Save Attendance Button */}
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
                      Save Today's Attendance
                    </>
                  )}
                </Button>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {/* Filter buttons */}
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/80">
                  {[
                    { id: "all", label: `All (${actualStudents.length})` },
                    { id: "present", label: `Present (${stats.presentCount})` },
                    { id: "absent", label: `Absent (${stats.absentCount})` },
                    { id: "unmarked", label: `Not Marked (${stats.unmarkedCount})` },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                        statusFilter === filter.id
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search student or roll..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
              </div>

              {/* Student Attendance Roster List */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-medium">Loading today's attendance roster...</span>
                </div>
              ) : filteredStudents.length > 0 ? (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredStudents.map((student) => {
                    const currentStatus = attendanceStatuses[student.userId] || null;
                    const presenceInfo = onlineUsersMap?.get(student.userId) || onlineUsersMap?.get(student.$id);
                    const liveStatus = presenceInfo?.status || "offline";

                    return (
                      <div
                        key={student.userId || student.$id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 ${
                          currentStatus === "present"
                            ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                            : currentStatus === "absent"
                            ? "bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50"
                            : "bg-slate-50/50 border-slate-200 hover:border-slate-300 dark:bg-slate-900/40 dark:border-slate-800"
                        }`}
                      >
                        {/* Student Info with Avatar & Live Presence Indicator */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <InteractiveAvatar
                              src={student.profileImage}
                              fallbackText={
                                student.userName
                                  ? student.userName.charAt(0).toUpperCase()
                                  : "S"
                              }
                              userId={student.userId}
                              editable={false}
                              className="h-10 w-10 border border-slate-200 dark:border-slate-700"
                            />
                            {/* Live Presence indicator dot */}
                            <span
                              title={`Live status: ${liveStatus}`}
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                liveStatus === "online"
                                  ? "bg-emerald-500"
                                  : liveStatus === "away"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {student.userName || student.name || "Student"}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-mono"
                              >
                                Roll: {student.studentId || student.rollNumber || "NA"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="capitalize">
                                Live Status:{" "}
                                <strong
                                  className={
                                    liveStatus === "online"
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-slate-500"
                                  }
                                >
                                  {liveStatus}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2-Button Touch Attendance Action Toggle (Present / Absent) */}
                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                          {/* ✅ Present Button */}
                          <button
                            type="button"
                            onClick={() => handleStudentStatusChange(student.userId, "present")}
                            className={`flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === "present"
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
                            className={`flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === "absent"
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
                <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Users className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No matching students found
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Try adjusting your search query or status filter.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TodayAttendanceModule;
