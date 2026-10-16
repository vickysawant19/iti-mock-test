import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  startOfMonth,
  parseISO,
} from "date-fns";
import {
  CalendarDays,
  X,
  LoaderCircle,
  History,
  Palmtree,
  ShieldAlert,
  Calendar as CalendarIcon,
  Check,
  CheckCheck,
  XCircle,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  UserX,
  AlertCircle,
  Trash2,
  RotateCcw,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { attendanceTrackingService, formatAttendanceTime } from "@/services/attendance/attendanceTrackingService";
import { newAttendanceService } from "@/services/attendance/newAttendanceService";
import { toast } from "react-toastify";
import StudentLeaveQuotaBadges from "@/private/Attendance/components/StudentLeaveQuotaBadges";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const REJECTION_PRESETS = [
  "No medical certificate / doctor proof provided",
  "Unexcused absence / no prior intimation",
  "Did not attend workshop or practicals",
  "Annual quota limit for this category reached",
  "Request submitted outside acceptable window",
];

/**
 * Redesigned Student Monthly Attendance Calendar & Stats Modal
 * Features a 2-column layout:
 * - Left: Interactive monthly calendar grid + instant status action toolbar (P, A, CL, SL, SPL, OD, HD, L, Undo/Clear).
 * - Right: Side panel containing Annual Leave Quotas, Monthly Summary, and Cumulative Inception Stats.
 */
export const StudentMonthlyAttendanceModal = ({
  isOpen,
  onClose,
  student,
  selectedMonth,
  attendanceMap,
  holidays,
  onAttendanceStatusChange,
  updatingAttendance,
  studentStats,
  onFetchStats,
  loadingStats,
  batchStartDate,
  batchEndDate,
  existingAttendance = [],
  selectedBatch = null,
  teacherId = null,
  onRefreshData = null,
}) => {
  const [selectedDateKey, setSelectedDateKey] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isVerifyingAction, setIsVerifyingAction] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState(null); // specific pending record to reject
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");

  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);

  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  const studentRawAttendanceMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(existingAttendance) && student?.userId) {
      existingAttendance.forEach((att) => {
        if (att.userId === student.userId && att.date) {
          map.set(att.date, att);
        }
      });
    }
    return map;
  }, [existingAttendance, student?.userId]);

  const pendingRecords = useMemo(() => {
    const list = [];
    studentRawAttendanceMap.forEach((att) => {
      if (att.verificationStatus === "PENDING") {
        list.push(att);
      }
    });
    return list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [studentRawAttendanceMap]);

  const leadingBlankDays = getDay(monthStart);

  // Track previous modal state to initialize selected date only on fresh modal open, student change, or month change
  const prevModalStateRef = useRef({ isOpen: false, studentId: null, monthKey: null });

  useEffect(() => {
    if (!isOpen || !student?.userId) {
      prevModalStateRef.current.isOpen = false;
      return;
    }

    const curMonthKey = format(selectedMonth, "yyyy-MM");
    const isFreshOpen = !prevModalStateRef.current.isOpen && isOpen;
    const isStudentChanged = prevModalStateRef.current.studentId !== student.userId;
    const isMonthChanged = prevModalStateRef.current.monthKey !== curMonthKey;

    prevModalStateRef.current = {
      isOpen: true,
      studentId: student.userId,
      monthKey: curMonthKey,
    };

    const monthStartStr = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
    const monthEndStr = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
    const todayStr = format(new Date(), "yyyy-MM-dd");

    // Fresh open or student switched: prefer first pending request date or today / month start
    if (isFreshOpen || isStudentChanged) {
      if (pendingRecords.length > 0) {
        setSelectedDateKey(pendingRecords[0].date);
        return;
      }
      if (todayStr >= monthStartStr && todayStr <= monthEndStr) {
        setSelectedDateKey(todayStr);
      } else {
        setSelectedDateKey(monthStartStr);
      }
      return;
    }

    // Month switched: if current selected date is outside new month, readjust
    if (isMonthChanged) {
      setSelectedDateKey((prevDate) => {
        if (prevDate && prevDate >= monthStartStr && prevDate <= monthEndStr) {
          return prevDate;
        }
        if (todayStr >= monthStartStr && todayStr <= monthEndStr) {
          return todayStr;
        }
        return monthStartStr;
      });
      return;
    }

    // On attendance update or data refresh: keep the selected date if already in the month!
    setSelectedDateKey((prevDate) => {
      if (prevDate && prevDate >= monthStartStr && prevDate <= monthEndStr) {
        return prevDate;
      }
      if (todayStr >= monthStartStr && todayStr <= monthEndStr) {
        return todayStr;
      }
      return monthStartStr;
    });
  }, [isOpen, student?.userId, selectedMonth]);

  // Calculate annual leave quota for student
  const leaveQuota = useMemo(() => {
    if (!student || !existingAttendance) {
      return {
        clTotal: 12,
        clUsed: 0,
        clRemaining: 12,
        slTotalDays: 15,
        slDaysUsed: 0,
        slDaysRemaining: 15,
        slMaxSpells: 2,
        slSpellsUsed: 0,
        slSpellsRemaining: 2,
        splUsed: 0,
        odUsed: 0,
        isClExceeded: false,
        isSlDaysExceeded: false,
        isSlSpellsExceeded: false,
      };
    }
    const targetYear = selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear();
    const userRecords = (existingAttendance || []).filter((r) => r.userId === student.userId);
    return attendanceTrackingService.calculateLeaveQuotas(userRecords, targetYear);
  }, [student, existingAttendance, selectedMonth]);

  const studentEnrollDateStr = !student?.isTeacher && student?.enrollmentDate
    ? String(student.enrollmentDate).substring(0, 10)
    : null;

  const monthStats = useMemo(() => {
    const today = new Date();

    let workingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let holidaysCount = 0;
    let leaveDays = 0;

    monthDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      const isFuture = isAfter(day, today);

      if (studentEnrollDateStr && key < studentEnrollDateStr) {
        return;
      }

      if (holidays.has(key)) {
        holidaysCount += 1;
        return;
      }

      if (isFuture) return;

      workingDays += 1;
      const status = String(attendanceMap.get(key) || "").toLowerCase();
      if (status === "present" || status === "p") presentDays += 1;
      else if (status === "absent" || status === "a") absentDays += 1;
      else if (["casual", "sick", "special", "on_duty", "leave", "cl", "sl", "spl", "od", "half_day", "hd", "late", "l"].includes(status)) {
        leaveDays += 1;
        presentDays += 1;
      }
    });

    return { workingDays, presentDays, absentDays, holidaysCount, leaveDays };
  }, [monthDays, holidays, attendanceMap, student?.isTeacher, studentEnrollDateStr]);

  if (!isOpen || !student) return null;

  const studentInitial = student.userName?.charAt(0)?.toUpperCase() || "S";

  const getStatusBadge = (statusStr) => {
    const config = attendanceTrackingService.getStatusConfig(statusStr);
    return {
      label: config.label,
      badge: config.code,
      cls: config.badgeClass,
    };
  };

  const selectedDateObj = parseISO(selectedDateKey);
  const selectedStatus = attendanceMap.get(selectedDateKey);
  const isSelectedHoliday = holidays.has(selectedDateKey);
  const isSelectedFuture = isAfter(selectedDateObj, new Date());
  const isSelectedBeforeBatch = batchStartDate && isBefore(selectedDateObj, new Date(batchStartDate));
  const isSelectedAfterBatch = batchEndDate && isAfter(selectedDateObj, new Date(batchEndDate));
  const isSelectedBeforeEnrollment = studentEnrollDateStr ? selectedDateKey < studentEnrollDateStr : false;
  const canEditSelected = (!isSelectedHoliday || student.isTeacher) && !isSelectedFuture && !isSelectedBeforeBatch && !isSelectedAfterBatch && !isSelectedBeforeEnrollment;
  const isSelectedUpdating = updatingAttendance.get(`${student.userId}-${selectedDateKey}`);
  const selectedBadgeInfo = getStatusBadge(selectedStatus);


  const selectedRawRecord = studentRawAttendanceMap.get(selectedDateKey);
  const isSelectedPending = selectedRawRecord?.verificationStatus === "PENDING";
  const isSelectedRejected = selectedRawRecord?.verificationStatus === "REJECTED";

  // Approve a single pending request (supports status override)
  const handleApprovePending = async (targetRecord = null, overrideStatus = null) => {
    const rec = targetRecord || selectedRawRecord;
    if (!rec || isVerifyingAction) return;
    setIsVerifyingAction(true);
    try {
      const finalStatus = overrideStatus || rec.status || "present";
      const badgeConf = attendanceTrackingService.getStatusConfig(finalStatus);
      const leaveTypeVal = ["casual", "cl"].includes(finalStatus)
        ? "CASUAL"
        : ["sick", "sl"].includes(finalStatus)
        ? "SICK"
        : ["special", "spl"].includes(finalStatus)
        ? "SPECIAL"
        : null;

      await newAttendanceService.verifyAttendanceRequests({
        requests: [
          {
            documentId: rec.$id,
            action: "APPROVE",
            status: finalStatus,
            attendanceStatus: badgeConf.code || finalStatus.toUpperCase(),
            leaveType: leaveTypeVal,
          },
        ],
        teacherId: teacherId || student?.teacherId,
        batchId: selectedBatch || rec.batchId,
      });

      toast.success(`Approved attendance for ${rec.date} as ${badgeConf.label} (${badgeConf.code})!`);
      if (typeof onRefreshData === "function") {
        await onRefreshData();
      } else if (typeof onAttendanceStatusChange === "function") {
        onAttendanceStatusChange(student.userId, rec.date, finalStatus);
      }
    } catch (err) {
      console.error("Error approving request:", err);
      toast.error(err.message || "Failed to approve attendance request");
    } finally {
      setIsVerifyingAction(false);
    }
  };

  // Batch approve ALL pending requests for this student
  const handleApproveAllPending = async () => {
    if (pendingRecords.length === 0 || isVerifyingAction) return;
    setIsVerifyingAction(true);
    try {
      const requests = pendingRecords.map((req) => ({
        documentId: req.$id,
        action: "APPROVE",
        status: req.status || "present",
        attendanceStatus: req.attendanceStatus || (req.status ? req.status.toUpperCase() : "PRESENT"),
        leaveType: req.leaveType || null,
      }));

      await newAttendanceService.verifyAttendanceRequests({
        requests,
        teacherId: teacherId || student?.teacherId,
        batchId: selectedBatch || pendingRecords[0]?.batchId,
      });

      toast.success(`Approved all ${requests.length} pending attendance requests for ${student.userName || "student"}!`);
      if (typeof onRefreshData === "function") {
        await onRefreshData();
      } else if (typeof onAttendanceStatusChange === "function") {
        pendingRecords.forEach((r) => {
          onAttendanceStatusChange(student.userId, r.date, r.status || "present");
        });
      }
    } catch (err) {
      console.error("Error approving all requests:", err);
      toast.error(err.message || "Failed to approve all attendance requests");
    } finally {
      setIsVerifyingAction(false);
    }
  };

  // Confirm rejection for single or bulk requests with instructor's note
  const handleConfirmReject = async () => {
    if (isVerifyingAction) return;
    setIsVerifyingAction(true);
    const reasonToUse = rejectionReasonText.trim() || "Rejected by instructor in monthly attendance modal";

    try {
      if (isBulkRejecting) {
        const requests = pendingRecords.map((req) => ({
          documentId: req.$id,
          action: "REJECT",
          rejectionReason: reasonToUse,
        }));
        await newAttendanceService.verifyAttendanceRequests({
          requests,
          teacherId: teacherId || student?.teacherId,
          batchId: selectedBatch || pendingRecords[0]?.batchId,
        });
        toast.info(`Rejected ${requests.length} attendance request(s). Marked as Absent.`);
        if (typeof onRefreshData === "function") {
          await onRefreshData();
        } else if (typeof onAttendanceStatusChange === "function") {
          pendingRecords.forEach((r) => {
            onAttendanceStatusChange(student.userId, r.date, "absent");
          });
        }
      } else if (rejectingRecord || selectedRawRecord) {
        const target = rejectingRecord || selectedRawRecord;
        await newAttendanceService.verifyAttendanceRequests({
          requests: [
            {
              documentId: target.$id,
              action: "REJECT",
              rejectionReason: reasonToUse,
            },
          ],
          teacherId: teacherId || student?.teacherId,
          batchId: selectedBatch || target.batchId,
        });
        toast.info(`Rejected request for ${target.date}. Marked as Absent.`);
        if (typeof onRefreshData === "function") {
          await onRefreshData();
        } else if (typeof onAttendanceStatusChange === "function") {
          onAttendanceStatusChange(student.userId, target.date, "absent");
        }
      }
      setRejectingRecord(null);
      setIsBulkRejecting(false);
      setRejectionReasonText("");
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.error(err.message || "Failed to reject attendance request");
    } finally {
      setIsVerifyingAction(false);
    }
  };

  const handleApplyStatus = (newStatus) => {
    if (!canEditSelected || isSelectedUpdating) return;
    onAttendanceStatusChange(student.userId, selectedDateKey, newStatus);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white dark:from-slate-950 dark:to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-indigo-400/40">
              <AvatarImage src={student.profileImage} alt={student.userName} />
              <AvatarFallback className="bg-indigo-600 text-white font-bold text-base">
                {studentInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {student.userName || "Student"}
                </h3>
                {student.isTeacher && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Instructor
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200/80 font-mono mt-0.5">
                Roll No: {student.studentId || "N/A"} • Monthly Attendance Register
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/attendance/register/${student.userId}${selectedBatch ? `?batchId=${selectedBatch}` : ""}`}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 transition border border-indigo-400/30"
              title="Open full dedicated student attendance page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open Full Page Log</span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body: 2-Column Responsive Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* LEFT MAIN AREA: Calendar Grid + Direct Status Control Toolbar */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto flex flex-col gap-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
            
            {/* Comprehensive Student Pending Verification Hub */}
            {pendingRecords.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/10 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 animate-in fade-in">
                {/* Hub Header & Batch Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Clock className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 flex items-center gap-2">
                        <span>Pending Attendance Verification</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-950 border border-amber-300 dark:bg-amber-900 dark:text-amber-200">
                          {pendingRecords.length} Request{pendingRecords.length > 1 ? "s" : ""}
                        </span>
                      </h4>
                      <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 font-medium">
                        Student submitted past attendance/leaves awaiting your review.
                      </p>
                    </div>
                  </div>

                  {/* Batch Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleApproveAllPending}
                      disabled={isVerifyingAction}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      title={`Approve all ${pendingRecords.length} pending requests`}
                    >
                      {isVerifyingAction ? (
                        <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Approve All ({pendingRecords.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkRejecting(true);
                        setRejectingRecord(null);
                        setRejectionReasonText("");
                      }}
                      disabled={isVerifyingAction}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      title="Reject all pending requests"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject All</span>
                    </button>
                  </div>
                </div>

                {/* Compact List of Pending Request Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {pendingRecords.map((req) => {
                    const isSelected = selectedDateKey === req.date;
                    const info = getStatusBadge(req.status || req.leaveType || "present");
                    let formattedDate = req.date;
                    try {
                      formattedDate = format(parseISO(req.date), "EEE, MMM d");
                    } catch (e) {}

                    return (
                      <div
                        key={req.$id || req.date}
                        onClick={() => setSelectedDateKey(req.date)}
                        className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? "bg-amber-100/90 dark:bg-amber-950/80 border-amber-500 ring-2 ring-amber-400 shadow-xs"
                            : "bg-white/90 dark:bg-slate-800/90 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                            {formattedDate}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${info.cls}`}>
                            {info.badge} ({info.label})
                          </span>
                        </div>

                        {req.remarks ? (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-1" title={req.remarks}>
                            "{req.remarks}"
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">No remarks provided</p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                          <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {req.markedAt ? formatAttendanceTime(req, "hh:mm a") : "Awaiting review"}
                          </span>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleApprovePending(req)}
                              disabled={isVerifyingAction}
                              className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
                              title="Approve this request"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingRecord(req);
                                setIsBulkRejecting(false);
                                setRejectionReasonText("");
                              }}
                              disabled={isVerifyingAction}
                              className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold flex items-center gap-0.5 cursor-pointer"
                              title="Reject this request"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Direct Status Action Toolbar */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/60 dark:bg-indigo-950/40 p-3 sm:p-4 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CalendarIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Selected: {format(parseISO(selectedDateKey), "EEEE, MMM d, yyyy")}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${selectedBadgeInfo.cls}`}>
                    {selectedBadgeInfo.label} ({selectedBadgeInfo.badge})
                  </span>
                </div>
                {isSelectedUpdating && (
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </span>
                )}
              </div>

              {/* Dedicated Review & Approve/Reject Card */}
              {isSelectedPending && selectedRawRecord && (
                <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/90 dark:border-amber-600 dark:bg-amber-950/70 p-3.5 sm:p-4 space-y-3 shadow-md animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                      <span className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100">
                        Review Attendance Request for {selectedDateKey}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-amber-200 text-amber-950 border border-amber-300 dark:bg-amber-900 dark:text-amber-200">
                      Requested: {selectedBadgeInfo.label} ({selectedBadgeInfo.badge})
                    </span>
                  </div>

                  {/* Quota Context Banner */}
                  {["cl", "casual"].includes(String(selectedRawRecord.status || "").toLowerCase()) && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs flex items-center justify-between">
                      <span className="text-indigo-900 dark:text-indigo-200 font-semibold">
                        Casual Leave (CL) Quota:
                      </span>
                      <span className={`font-mono font-black text-xs ${leaveQuota.isClExceeded ? "text-rose-600 dark:text-rose-400" : "text-indigo-800 dark:text-indigo-300"}`}>
                        {leaveQuota.clRemaining} / 12 days remaining {leaveQuota.isClExceeded ? "(Limit Exceeded!)" : "Available"}
                      </span>
                    </div>
                  )}

                  {["sl", "sick"].includes(String(selectedRawRecord.status || "").toLowerCase()) && (
                    <div className="p-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs flex items-center justify-between">
                      <span className="text-amber-950 dark:text-amber-200 font-semibold">
                        Sick Leave (SL) Quota:
                      </span>
                      <span className={`font-mono font-black text-xs ${leaveQuota.isSlDaysExceeded ? "text-rose-600 dark:text-rose-400" : "text-amber-900 dark:text-amber-300"}`}>
                        {leaveQuota.slDaysRemaining} / 15 days remaining ({leaveQuota.slSpellsRemaining}/2 spells) {leaveQuota.isSlDaysExceeded ? "(Limit Exceeded!)" : "Available"}
                      </span>
                    </div>
                  )}

                  <div className="text-xs space-y-1.5 bg-white/90 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>Requested Date: <strong className="text-slate-900 dark:text-white font-mono">{selectedDateKey}</strong></span>
                      {selectedRawRecord.markedAt && (
                        <span>Submitted At: <strong className="text-slate-900 dark:text-white">{formatAttendanceTime(selectedRawRecord, "MMM d, hh:mm a")}</strong></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 pt-1">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Student's Reason: </span>
                      <span className="italic font-medium">"{selectedRawRecord.remarks || "No reason specified"}"</span>
                    </p>
                  </div>

                  {/* Immediate Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleApprovePending(selectedRawRecord)}
                      disabled={isVerifyingAction}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isVerifyingAction ? (
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Approve Request ({selectedBadgeInfo.badge})</span>
                    </button>

                    {/* Alternative Approval as Present if requested something else */}
                    {selectedBadgeInfo.badge !== "P" && (
                      <button
                        type="button"
                        onClick={() => handleApprovePending(selectedRawRecord, "present")}
                        disabled={isVerifyingAction}
                        className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 border border-emerald-300 dark:border-emerald-800"
                        title="Approve as Present instead"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Approve as Present (P)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setRejectingRecord(selectedRawRecord);
                        setIsBulkRejecting(false);
                        setRejectionReasonText("");
                      }}
                      disabled={isVerifyingAction}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Reject (Mark Absent)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Inline Rejection Reason Modal / Drawer */}
              {(rejectingRecord || isBulkRejecting) && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/90 border-2 border-rose-300 dark:border-rose-800 animate-in slide-in-from-bottom duration-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-100">
                        {isBulkRejecting
                          ? `Rejecting All ${pendingRecords.length} Requests (Mark as Absent)`
                          : `Reject Request for ${rejectingRecord?.date || selectedDateKey} (Mark as Absent)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingRecord(null);
                        setIsBulkRejecting(false);
                      }}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Quick Reason Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {REJECTION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectionReasonText(preset)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-medium hover:bg-rose-100 transition cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    placeholder="Provide a reason for the student..."
                    className="w-full text-xs p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingRecord(null);
                        setIsBulkRejecting(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReject}
                      disabled={isVerifyingAction}
                      className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingAction && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
                      <span>Confirm Rejection</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Rejected Notice */}
              {isSelectedRejected && selectedRawRecord && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-2.5 px-3 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Request Rejected:</strong> "{selectedRawRecord.rejectionReason || "Rejected by instructor"}" (Status marked as Absent)
                  </span>
                </div>
              )}

              {/* Status Action Buttons & Undo */}
              {canEditSelected ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 block sm:inline">Set Status:</span>
                  
                  {/* Present */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("present")}
                    disabled={isSelectedUpdating}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                      String(selectedStatus || "").toLowerCase() === "present" || String(selectedStatus || "").toLowerCase() === "p"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-emerald-800 hover:bg-emerald-100 border-emerald-300 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-800"
                    }`}
                    title="Mark Present (P)"
                  >
                    <Check className="h-3.5 w-3.5" /> Present (P)
                  </button>

                  {!isSelectedHoliday && (
                    <>
                      {/* Absent */}
                      <button
                        type="button"
                        onClick={() => handleApplyStatus("absent")}
                        disabled={isSelectedUpdating}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                          String(selectedStatus || "").toLowerCase() === "absent" || String(selectedStatus || "").toLowerCase() === "a"
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : "bg-white text-rose-800 hover:bg-rose-100 border-rose-300 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-800"
                        }`}
                        title="Mark Absent (A)"
                      >
                        <UserX className="h-3.5 w-3.5" /> Absent (A)
                      </button>

                      {/* Casual Leave */}
                      <button
                        type="button"
                        onClick={() => handleApplyStatus("casual")}
                        disabled={isSelectedUpdating}
                        title={leaveQuota.isClExceeded ? "Warning: CL Quota Exceeded (12/yr)" : "Casual Leave"}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                          String(selectedStatus || "").toLowerCase() === "casual" || String(selectedStatus || "").toLowerCase() === "cl"
                            ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                            : "bg-white text-amber-800 hover:bg-amber-100 border-amber-300 dark:bg-slate-900 dark:text-amber-300 dark:border-amber-800"
                        }`}
                      >
                        <span>CL ({leaveQuota.clRemaining} left)</span>
                        {leaveQuota.isClExceeded && <AlertCircle className="w-3.5 h-3.5 text-rose-300" />}
                      </button>

                      {/* Sick Leave */}
                      <button
                        type="button"
                        onClick={() => handleApplyStatus("sick")}
                        disabled={isSelectedUpdating}
                        title={leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded ? "Warning: SL Limit Exceeded" : "Sick Leave"}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                          String(selectedStatus || "").toLowerCase() === "sick" || String(selectedStatus || "").toLowerCase() === "sl"
                            ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                            : "bg-white text-sky-800 hover:bg-sky-100 border-sky-300 dark:bg-slate-900 dark:text-sky-300 dark:border-sky-800"
                        }`}
                      >
                        <span>SL ({leaveQuota.slDaysRemaining}d left)</span>
                        {(leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded) && <AlertCircle className="w-3.5 h-3.5 text-rose-300" />}
                      </button>

                      {/* Special Leave */}
                      <button
                        type="button"
                        onClick={() => handleApplyStatus("special")}
                        disabled={isSelectedUpdating}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                          String(selectedStatus || "").toLowerCase() === "special" || String(selectedStatus || "").toLowerCase() === "spl"
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-white text-purple-800 hover:bg-purple-100 border-purple-300 dark:bg-slate-900 dark:text-purple-300 dark:border-purple-800"
                        }`}
                      >
                        <span>SPL</span>
                      </button>

                      {/* On Duty */}
                      <button
                        type="button"
                        onClick={() => handleApplyStatus("on_duty")}
                        disabled={isSelectedUpdating}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                          String(selectedStatus || "").toLowerCase() === "on_duty" || String(selectedStatus || "").toLowerCase() === "od"
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                            : "bg-white text-teal-800 hover:bg-teal-100 border-teal-300 dark:bg-slate-900 dark:text-teal-300 dark:border-teal-800"
                        }`}
                      >
                        <span>OD</span>
                      </button>

                      {/* Half Day */}
                      <button
                        type="button"
                        onClick={() => handleApplyStatus("half_day")}
                        disabled={isSelectedUpdating}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                          String(selectedStatus || "").toLowerCase() === "half_day" || String(selectedStatus || "").toLowerCase() === "hd"
                            ? "bg-yellow-500 text-white border-yellow-500 shadow-xs"
                            : "bg-white text-yellow-800 hover:bg-yellow-100 border-yellow-300 dark:bg-slate-900 dark:text-yellow-300 dark:border-yellow-800"
                        }`}
                      >
                        <span>HD</span>
                      </button>

                      {/* Late */}
                      <button
                        type="button"
                        onClick={() => handleApplyStatus("late")}
                        disabled={isSelectedUpdating}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                          String(selectedStatus || "").toLowerCase() === "late" || String(selectedStatus || "").toLowerCase() === "l"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-indigo-800 hover:bg-indigo-100 border-indigo-300 dark:bg-slate-900 dark:text-indigo-300 dark:border-indigo-800"
                        }`}
                      >
                        <span>L</span>
                      </button>
                    </>
                  )}

                  {/* Undo / Clear Attendance */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("clear")}
                    disabled={isSelectedUpdating}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border bg-slate-100 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-900 flex items-center gap-1 ml-auto"
                    title="Undo / Clear attendance for this date"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Undo / Clear</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                  {isSelectedHoliday
                    ? `Exempted: ${holidays.get(selectedDateKey)?.holidayText || "Holiday"}`
                    : isSelectedFuture
                    ? "Future date — Attendance marking disabled."
                    : isSelectedBeforeEnrollment
                    ? `Date is before student's enrollment date (${studentEnrollDateStr}).`
                    : "Date outside batch operational period."}
                </p>
              )}
            </div>

            {/* Calendar Grid Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />
                  {format(selectedMonth, "MMMM yyyy")} Calendar Grid
                </h4>
                <span className="text-[11px] text-slate-400">Click any date to select & change status</span>
              </div>

              {/* Weekdays Header */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 dark:text-slate-400 py-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                {WEEK_DAYS.map((wd) => (
                  <div key={wd}>{wd}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: leadingBlankDays }).map((_, idx) => (
                  <div
                    key={`blank-${idx}`}
                    className="h-[60px] rounded-md bg-slate-50/50 dark:bg-slate-900/30 border border-transparent"
                  />
                ))}

                {monthDays.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const status = attendanceMap.get(dateKey);
                  const isHoliday = holidays.has(dateKey);
                  const isFuture = isAfter(day, new Date());

                  const isBeforeBatch = batchStartDate && isBefore(day, new Date(batchStartDate));
                  const isAfterBatch = batchEndDate && isAfter(day, new Date(batchEndDate));
                  const isBeforeEnrollment = studentEnrollDateStr ? dateKey < studentEnrollDateStr : false;
                  const canEdit = (!isHoliday || student.isTeacher) && !isFuture && !isBeforeBatch && !isAfterBatch && !isBeforeEnrollment;

                  const isUpdating = updatingAttendance.get(`${student.userId}-${dateKey}`);
                  const badgeInfo = getStatusBadge(status);
                  const isSelected = selectedDateKey === dateKey;

                  const rawRec = studentRawAttendanceMap.get(dateKey);
                  const markedAtTime = rawRec ? formatAttendanceTime(rawRec, "hh:mm a") : null;

                  const isCellPending = rawRec?.verificationStatus === "PENDING";

                  return (
                    <button
                      key={dateKey}
                      disabled={!canEdit || isUpdating}
                      onClick={() => {
                        setSelectedDateKey(dateKey);
                      }}
                      className={`h-[60px] rounded-md border text-left p-1.5 transition disabled:cursor-not-allowed disabled:opacity-60 flex flex-col justify-between relative ${
                        isSelected ? "ring-2 ring-indigo-500 border-indigo-500 shadow-md scale-[1.02] z-10" : ""
                      } ${
                        isBeforeEnrollment
                          ? "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700"
                          : isHoliday && !student.isTeacher
                          ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                          : isBeforeBatch || isAfterBatch
                          ? "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700"
                          : isCellPending
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400"
                          : badgeInfo.cls
                      }`}
                      title={
                        isBeforeEnrollment
                          ? `Date is before student's enrollment date (${studentEnrollDateStr})`
                          : isHoliday && !student.isTeacher
                          ? holidays.get(dateKey)?.holidayText || "Holiday"
                          : isBeforeBatch
                          ? "Date is before batch start"
                          : isAfterBatch
                          ? "Date is after batch end"
                          : isCellPending
                          ? `⏳ Pending Approval: ${badgeInfo.label}${markedAtTime ? ` • Marked at ${markedAtTime}` : ''} - Click to review request`
                          : `${badgeInfo.label}${markedAtTime ? ` • Marked at ${markedAtTime}` : ''} - Click to select date`
                      }
                    >
                      <div className="flex justify-between items-start">
                        <p className={`text-xs font-bold ${isAfterBatch || isBeforeEnrollment ? "line-through opacity-50" : ""}`}>
                          {format(day, "d")}
                        </p>
                        {isUpdating ? (
                          <LoaderCircle className="h-3 w-3 animate-spin text-indigo-500" />
                        ) : isCellPending ? (
                          <span className="flex h-2 w-2 relative" title="Pending Instructor Verification">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                        ) : null}
                      </div>

                      <p className="text-[10px] uppercase tracking-wide font-black truncate">
                        {isBeforeEnrollment
                          ? "X"
                          : isHoliday && !student.isTeacher
                          ? "Holiday"
                          : isBeforeBatch
                          ? "Pre-Batch"
                          : isAfterBatch
                          ? "Post-Batch"
                          : isFuture
                          ? "Future"
                          : isCellPending
                          ? `⏳ ${badgeInfo.badge}`
                          : badgeInfo.badge}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT SIDE PANEL COLUMN: Stats & Quotas Sidebar */}
          <div className="w-full md:w-80 p-4 sm:p-5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 overflow-y-auto flex flex-col gap-4">
            
            {/* Section 1: Annual Leave Quotas Card */}
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Palmtree className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Annual Leave Quotas ({selectedMonth ? format(selectedMonth, "yyyy") : "Year"})
                </span>
                {(leaveQuota.isClExceeded || leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded) && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Exceeded
                  </span>
                )}
              </div>
              <StudentLeaveQuotaBadges quota={leaveQuota} layout="grid" />
            </div>

            {/* Section 2: Monthly Attendance Summary */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-indigo-500" />
                Monthly Summary ({format(selectedMonth, "MMM yyyy")})
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Working Days</p>
                  <p className="text-base font-black text-slate-800 dark:text-slate-100">{monthStats.workingDays}</p>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                  <p className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">Present Days</p>
                  <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{monthStats.presentDays}</p>
                </div>

                <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 dark:border-rose-900/60 dark:bg-rose-950/30">
                  <p className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300 tracking-wider">Absent Days</p>
                  <p className="text-base font-black text-rose-700 dark:text-rose-300">{monthStats.absentDays}</p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <p className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 tracking-wider">Holidays</p>
                  <p className="text-base font-black text-amber-700 dark:text-amber-300">{monthStats.holidaysCount}</p>
                </div>
              </div>
            </div>

            {/* Section 3: Cumulative Performance Inception Stats */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <History className="h-3.5 w-3.5 text-indigo-500" />
                  Cumulative Performance
                </span>
                <button
                  onClick={() => onFetchStats && onFetchStats(student.userId)}
                  disabled={loadingStats}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
                >
                  {loadingStats ? (
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                  ) : (
                    "Refresh Stats"
                  )}
                </button>
              </div>

              {studentStats ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 text-[10px] block font-semibold">Prev Working</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{studentStats.workingDays || 0}</span>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] block font-semibold">Total Present</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{studentStats.totalPresent !== undefined ? studentStats.totalPresent : (studentStats.presentDays || 0)}</span>
                  </div>
                  <div className="bg-rose-50/50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-100 dark:border-rose-900/50">
                    <span className="text-rose-600 dark:text-rose-400 text-[10px] block font-semibold">Prev Absent</span>
                    <span className="font-bold text-rose-700 dark:text-rose-300">{studentStats.absentDays || 0}</span>
                  </div>
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-indigo-600 dark:text-indigo-400 text-[10px] block font-semibold">Prev Attendance %</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-300">{studentStats.percentage || 0}%</span>
                  </div>
                  <div className="col-span-2 grid grid-cols-4 gap-1 text-[10px] pt-1.5 border-t border-slate-200 dark:border-slate-800">
                    <div className="bg-amber-50/80 dark:bg-amber-950/50 p-1.5 rounded text-center border border-amber-200/50 dark:border-amber-900/50">
                      <span className="text-amber-800 dark:text-amber-300 font-bold block text-[9px]">CL</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">{studentStats.casualLeaves || 0}</span>
                    </div>
                    <div className="bg-sky-50/80 dark:bg-sky-950/50 p-1.5 rounded text-center border border-sky-200/50 dark:border-sky-900/50">
                      <span className="text-sky-800 dark:text-sky-300 font-bold block text-[9px]">SL</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">{studentStats.sickLeaves || 0}</span>
                    </div>
                    <div className="bg-purple-50/80 dark:bg-purple-950/50 p-1.5 rounded text-center border border-purple-200/50 dark:border-purple-900/50">
                      <span className="text-purple-800 dark:text-purple-300 font-bold block text-[9px]">SPL</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">{studentStats.specialLeaves || 0}</span>
                    </div>
                    <div className="bg-blue-50/80 dark:bg-blue-950/50 p-1.5 rounded text-center border border-blue-200/50 dark:border-blue-900/50">
                      <span className="text-blue-800 dark:text-blue-300 font-bold block text-[9px]">OD</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">{studentStats.onDutyLeaves || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Click 'Refresh Stats' to view cumulative attendance statistics up to previous month.
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Click any date on the calendar grid, then select P, A, CL, SL, SPL, OD, HD, L, or Undo / Clear.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs hover:opacity-90 transition ml-auto"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
};

export { StudentMonthlyAttendanceModal as StudentAttendanceEditModal };
export default StudentMonthlyAttendanceModal;
