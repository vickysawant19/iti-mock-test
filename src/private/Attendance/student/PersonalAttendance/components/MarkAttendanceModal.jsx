import React, { useMemo, useState, useEffect } from "react";
import { format, eachDayOfInterval } from "date-fns";
import {
  Check,
  X,
  MapPin,
  Loader2,
  Clock,
  AlertCircle,
  Calendar,
  CalendarRange,
  Coffee,
  HeartPulse,
  Sparkles,
  Info,
  ChevronRight,
  RotateCcw,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const isSecondOrFourthSaturday = (dateObj) => {
  if (dateObj.getDay() !== 6) return false;
  const weekNumber = Math.ceil(dateObj.getDate() / 7);
  return weekNumber === 2 || weekNumber === 4;
};

const STATUS_OPTIONS = [
  {
    id: "present",
    code: "P",
    label: "Present",
    subLabel: "Attended ITI",
    activeClass: "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/30",
    idleClass: "bg-emerald-50/80 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100/70",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    id: "absent",
    code: "A",
    label: "Absent",
    subLabel: "Did not attend",
    activeClass: "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20 ring-2 ring-rose-500/30",
    idleClass: "bg-rose-50/80 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/60 hover:bg-rose-100/70",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  {
    id: "cl",
    code: "CL",
    label: "Casual Leave",
    subLabel: "Personal / urgent",
    activeClass: "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/30",
    idleClass: "bg-indigo-50/80 text-indigo-800 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/60 hover:bg-indigo-100/70",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  },
  {
    id: "sl",
    code: "SL",
    label: "Sick Leave",
    subLabel: "Medical illness",
    activeClass: "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/30",
    idleClass: "bg-amber-50/80 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60 hover:bg-amber-100/70",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  {
    id: "spl",
    code: "SPL",
    label: "Special Leave",
    subLabel: "Approved event",
    activeClass: "bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-600/20 ring-2 ring-purple-500/30",
    idleClass: "bg-purple-50/80 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/60 hover:bg-purple-100/70",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
];

const QUICK_REASONS = [
  "Attended practicals and workshop",
  "Medical illness / doctor recommended rest",
  "Urgent family personal matter",
  "Represented college in sports/competition",
];

const MarkAttendanceModal = ({ 
  isOpen, 
  onClose, 
  batchData, 
  enrollmentDate,
  leaveQuota = {
    clTotal: 12,
    clUsed: 0,
    clPending: 0,
    clRemaining: 12,
    slTotalDays: 15,
    slDaysUsed: 0,
    slDaysPending: 0,
    slDaysRemaining: 15,
    splUsed: 0,
    isClExceeded: false,
    isSlDaysExceeded: false,
  },
  onMarkAttendance,
  onMarkMultipleAttendance,
  onCancelRequest,
  onUpdateRequest,
  holidays,
  selectedDate,
  selectedAttendance,
  existingAttendanceByDate,
  todayAttendance,
  deviceLocation,
  locationText,
  locLoading,
  locError,
  calculateDistance,
}) => {
  const [isMarking, setIsMarking] = useState(false);
  const [markedResult, setMarkedResult] = useState(null);
  const [pastReason, setPastReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("present");
  const [rangeMode, setRangeMode] = useState("single"); // "single" | "range"
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [isEditingPending, setIsEditingPending] = useState(false);
  const [isCancellingPending, setIsCancellingPending] = useState(false);
  const [pendingEditStatus, setPendingEditStatus] = useState("present");
  const [pendingEditReason, setPendingEditReason] = useState("");

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const initialDate = selectedDate || todayStr;

  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);

  useEffect(() => {
    if (isOpen) {
      const init = selectedDate || todayStr;
      setStartDate(init);
      setEndDate(init);
      setMarkedResult(null);
      setPastReason("");
      setSelectedStatus("present");
      setRangeMode("single");
      setIsResubmitting(false);
      setIsEditingPending(false);
      setIsCancellingPending(false);
      setPendingEditStatus("present");
      setPendingEditReason("");
    }
  }, [isOpen, selectedDate, todayStr]);

  const enrollDateStr = useMemo(() => {
    if (!enrollmentDate) return null;
    if (typeof enrollmentDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(enrollmentDate)) {
      return enrollmentDate;
    }
    try {
      return format(new Date(enrollmentDate), "yyyy-MM-dd");
    } catch {
      return null;
    }
  }, [enrollmentDate]);

  const isToday = startDate === todayStr && rangeMode === "single";
  const isPast = rangeMode === "range" || startDate < todayStr;
  const isBeforeEnrollment = enrollDateStr ? startDate < enrollDateStr : false;

  const distance = useMemo(() => {
    if (!deviceLocation || !batchData?.location) return Infinity;
    return calculateDistance(
      deviceLocation.lat,
      deviceLocation.lon,
      batchData.location.lat,
      batchData.location.lon
    );
  }, [deviceLocation, batchData?.location, calculateDistance]);

  const maxRadius = (Number(batchData?.circleRadius) || 1000) + 75;
  const distPercent = Math.min((distance / maxRadius) * 100, 100);

  const currentStatus = String(selectedAttendance?.status || "").toLowerCase();
  const todayStatus = String(todayAttendance?.status || "").toLowerCase();
  const effectiveStatus = isToday ? todayStatus : currentStatus;
  const isPresent = effectiveStatus === "present";
  const isAbsent  = effectiveStatus === "absent";
  const isLeave   = effectiveStatus === "leave";

  const isPending = selectedAttendance?.verificationStatus === "PENDING";
  const isPendingCorrection = isPending && selectedAttendance?.remarks?.includes("[CORRECTION_REQUEST]");
  const isRejected = selectedAttendance?.verificationStatus === "REJECTED";
  const rejectionReason = selectedAttendance?.rejectionReason;

  const isVerified = selectedAttendance?.verificationStatus === "VERIFIED" && !selectedAttendance?.autoGenerated;
  const isVerifiedAbsent = isVerified && isAbsent;
  const isVerifiedNonAbsent = isVerified && !isAbsent;

  // ── Range Analysis (Skip Sundays, 2nd/4th Saturdays, Batch Holidays, & Existing Records) ───────
  const rangeAnalysis = useMemo(() => {
    if (rangeMode !== "range" || !startDate || !endDate || startDate > endDate) {
      return { workingDays: [startDate], skippedDays: [], totalDays: 1 };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = eachDayOfInterval({ start, end });

    const workingDays = [];
    const skippedDays = [];

    days.forEach((dayObj) => {
      const dateStr = format(dayObj, "yyyy-MM-dd");
      
      if (dateStr > todayStr) {
        skippedDays.push({ date: dateStr, reason: "Future date" });
        return;
      }
      if (enrollDateStr && dateStr < enrollDateStr) {
        skippedDays.push({ date: dateStr, reason: "Before enrollment" });
        return;
      }
      if (dayObj.getDay() === 0) {
        skippedDays.push({ date: dateStr, reason: "Sunday (Weekend)" });
        return;
      }
      if (isSecondOrFourthSaturday(dayObj)) {
        skippedDays.push({ date: dateStr, reason: "Saturday Off (2nd/4th)" });
        return;
      }
      if (holidays instanceof Map && holidays.has(dateStr)) {
        skippedDays.push({ date: dateStr, reason: `Holiday (${holidays.get(dateStr) || "Public"})` });
        return;
      }
      if (existingAttendanceByDate instanceof Map && existingAttendanceByDate.has(dateStr)) {
        const exist = existingAttendanceByDate.get(dateStr);
        if (exist?.verificationStatus === "VERIFIED") {
          skippedDays.push({ date: dateStr, reason: `Already verified (${exist.status || exist.attendanceStatus || "Record"})` });
          return;
        }
        if (exist?.verificationStatus === "PENDING") {
          skippedDays.push({ date: dateStr, reason: "Already pending review" });
          return;
        }
      }

      workingDays.push(dateStr);
    });

    return {
      workingDays,
      skippedDays,
      totalDays: days.length,
    };
  }, [rangeMode, startDate, endDate, todayStr, enrollDateStr, holidays, existingAttendanceByDate]);

  const requestedDaysCount = rangeMode === "range" ? rangeAnalysis.workingDays.length : 1;
  const isClQuotaExceeded = selectedStatus === "cl" && requestedDaysCount > (leaveQuota?.clRemaining ?? 12);
  const isSlQuotaExceeded = selectedStatus === "sl" && requestedDaysCount > (leaveQuota?.slDaysRemaining ?? 15);
  const isLeaveQuotaExceeded = isClQuotaExceeded || isSlQuotaExceeded;

  // Dynamic status options: remove CL and SL after quota exceeded (Requirement 7)
  const availableStatusOptions = useMemo(() => {
    return STATUS_OPTIONS.filter((opt) => {
      // If student is raising a correction on an already absent record, exclude absent
      if (isVerifiedAbsent && opt.id === "absent") {
        return false;
      }
      // Remove CL if quota is exhausted
      if (opt.id === "cl") {
        const remaining = leaveQuota?.clRemaining ?? 12;
        return remaining > 0 && requestedDaysCount <= remaining;
      }
      // Remove SL if quota is exhausted
      if (opt.id === "sl") {
        const remaining = leaveQuota?.slDaysRemaining ?? 15;
        return remaining > 0 && requestedDaysCount <= remaining;
      }
      return true;
    });
  }, [leaveQuota?.clRemaining, leaveQuota?.slDaysRemaining, requestedDaysCount, isVerifiedAbsent]);

  useEffect(() => {
    if (!availableStatusOptions.some((opt) => opt.id === selectedStatus)) {
      setSelectedStatus(availableStatusOptions[0]?.id || "present");
    }
  }, [availableStatusOptions, selectedStatus]);

  // Verified present/leave records cannot be marked or updated (Requirement 2 & 3)
  const isMarkingAllowed = isPast
    ? (!isBeforeEnrollment && !isLeaveQuotaExceeded && pastReason.trim().length > 0 && (rangeMode === "range" ? rangeAnalysis.workingDays.length > 0 : (!isPending && (!isRejected || isResubmitting) && !isVerifiedNonAbsent)))
    : (!isBeforeEnrollment && distance !== Infinity && distance <= maxRadius && !isPresent);

  const handleStartEditPending = () => {
    const rawSt = selectedAttendance?.leaveType || selectedAttendance?.status || selectedAttendance?.attendanceStatus || "present";
    setPendingEditStatus(rawSt.toLowerCase());
    const rawRemarks = (selectedAttendance?.remarks || "").replace("[CORRECTION_REQUEST]", "").trim();
    setPendingEditReason(rawRemarks);
    setIsEditingPending(true);
  };

  const handleCancelPending = async () => {
    if (isCancellingPending || !onCancelRequest || !selectedAttendance) return;
    setIsCancellingPending(true);
    try {
      await onCancelRequest(selectedAttendance);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancellingPending(false);
    }
  };

  const handleUpdatePending = async () => {
    if (isMarking || !onUpdateRequest || !selectedAttendance) return;
    if (!pendingEditReason.trim()) return;
    setIsMarking(true);
    try {
      await onUpdateRequest(selectedAttendance, {
        status: pendingEditStatus,
        remarks: pendingEditReason.trim(),
      });
      setIsEditingPending(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleMark = async (overrideStatus = null) => {
    if (!isMarkingAllowed || isMarking) return;
    const finalStatus = overrideStatus || selectedStatus;

    if (isToday && isPresent && finalStatus === "present") return;
    setIsMarking(true);

    try {
      if (isPast && rangeMode === "range") {
        const datesToSubmit = rangeAnalysis.workingDays;
        const remarksText = pastReason.trim() + ` [Past Date Range: ${startDate} to ${endDate}]`;

        if (typeof onMarkMultipleAttendance === "function") {
          await onMarkMultipleAttendance({
            dates: datesToSubmit,
            status: finalStatus,
            remarks: remarksText,
          });
        } else {
          for (const d of datesToSubmit) {
            await onMarkAttendance(d, finalStatus, remarksText);
          }
        }
        setMarkedResult({ status: finalStatus, count: datesToSubmit.length });
      } else {
        const remarksText = isPast
          ? (pastReason.trim() || `Past attendance request (${startDate})`)
          : (locationText || `Marked from student app (${startDate})`);

        await onMarkAttendance(
          startDate,
          finalStatus,
          remarksText
        );
        setMarkedResult({ status: finalStatus, count: 1 });
      }

      setTimeout(() => {
        onClose();
        setMarkedResult(null);
        setPastReason("");
      }, 2200);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarking(false);
    }
  };

  if (!isOpen) return null;

  const showSuccess = markedResult !== null;

  const statusBadgeClass = isPending
    ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 animate-pulse"
    : isRejected
    ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
    : isPresent
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
    : isAbsent
    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
    : isLeave
    ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800"
    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300";

  const dotClass = isPending
    ? "bg-amber-500 animate-ping"
    : isRejected
    ? "bg-rose-500"
    : isPresent
    ? "bg-emerald-500"
    : isAbsent
    ? "bg-rose-500"
    : isLeave
    ? "bg-violet-500"
    : "bg-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden translate-y-0 animate-in slide-in-from-bottom flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 pb-6 overflow-y-auto space-y-4">
          {/* Drag handle (mobile) */}
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />

          {/* Modal Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {isPast ? "Past Attendance Request" : "Mark Today's Attendance"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isPast
                  ? "Submit past attendance or leave for instructor verification"
                  : `Verify your GPS location to mark attendance for ${todayStr}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switch for Past Attendance */}
          {isPast && !isVerifiedAbsent && (
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setRangeMode("single")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rangeMode === "single"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Single Day</span>
              </button>
              <button
                type="button"
                onClick={() => setRangeMode("range")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rangeMode === "range"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Multiple Days (Date Range)</span>
              </button>
            </div>
          )}

          {/* Single day current status badge */}
          {rangeMode === "single" && (
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold border ${statusBadgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
              Status on {startDate}: <span className="capitalize">{isPendingCorrection ? "Pending Correction on Absent" : isPending ? "Pending Verification" : isRejected ? "Request Rejected" : (effectiveStatus || "not marked")}</span>
            </div>
          )}

          {!showSuccess ? (
            rangeMode === "single" && isPending ? (
              isEditingPending ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="rounded-2xl border-2 border-indigo-400 bg-indigo-50/70 dark:border-indigo-600 dark:bg-indigo-950/50 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3 pb-3 border-b border-indigo-200 dark:border-indigo-800">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-indigo-950 dark:text-indigo-100">
                          Edit Pending Request
                        </h3>
                        <p className="text-xs text-indigo-800/80 dark:text-indigo-300 font-medium">
                          Update status or reason before instructor verifies it
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Attendance Status <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {availableStatusOptions.map((opt) => {
                          const isSelected = pendingEditStatus === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setPendingEditStatus(opt.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected ? opt.activeClass : opt.idleClass
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-mono font-black text-xs">{opt.code}</span>
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <span className="font-bold text-xs leading-tight">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Reason <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={pendingEditReason}
                        onChange={(e) => setPendingEditReason(e.target.value)}
                        placeholder="Update your reason for this request..."
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleUpdatePending}
                        disabled={isMarking || !pendingEditReason.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isMarking ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingPending(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/80 dark:border-amber-600 dark:bg-amber-950/60 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3 pb-3 border-b border-amber-200 dark:border-amber-800">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-100 flex items-center gap-2">
                          <span>Attendance Request Under Review</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-200">
                            Pending
                          </span>
                        </h3>
                        <p className="text-xs text-amber-900/80 dark:text-amber-300 font-medium">
                          Awaiting verification by your instructor
                        </p>
                      </div>
                    </div>

                    {isPendingCorrection && (
                      <div className="p-2.5 rounded-xl bg-amber-200/60 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 text-[11px] text-amber-950 dark:text-amber-200 font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
                        <span>Correction requested on Absent record. It remains Absent until approved.</span>
                      </div>
                    )}

                    <div className="bg-white/90 dark:bg-slate-900/80 rounded-xl p-3.5 border border-amber-200/80 dark:border-amber-800/60 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Requested Date:</span>
                        <strong className="text-slate-900 dark:text-white font-mono text-xs">{startDate}</strong>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Requested Status:</span>
                        <span className="font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-[11px] border border-amber-300 dark:border-amber-700">
                          {selectedAttendance?.leaveType || selectedAttendance?.attendanceStatus || selectedAttendance?.status || "Present"}
                        </span>
                      </div>

                      {selectedAttendance?.markedAt && (
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Submitted On:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {format(new Date(selectedAttendance.markedAt), "MMM d, yyyy • hh:mm a")}
                          </span>
                        </div>
                      )}

                      {selectedAttendance?.remarks && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-[10px] uppercase text-slate-400 block mb-0.5">
                            Your Submitted Reason:
                          </span>
                          <p className="italic text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                            "{selectedAttendance.remarks.replace("[CORRECTION_REQUEST]", "").trim()}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                      <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <span>
                        You can edit or cancel this request anytime before your instructor verifies it.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleStartEditPending}
                        className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Request</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPending}
                        disabled={isCancellingPending}
                        className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isCancellingPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Cancel Request</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )
            ) : rangeMode === "single" && isRejected && !isResubmitting ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/90 dark:border-rose-800 dark:bg-rose-950/60 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3 pb-3 border-b border-rose-200 dark:border-rose-800">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-xs">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-rose-950 dark:text-rose-100">
                        Attendance Request Rejected
                      </h3>
                      <p className="text-xs text-rose-800/80 dark:text-rose-300 font-medium">
                        Your instructor rejected this request. Status recorded as Absent.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 dark:bg-slate-900/80 rounded-xl p-3.5 border border-rose-200 dark:border-rose-800/60 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Date:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{startDate}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-[10px] uppercase text-rose-600 dark:text-rose-400 block mb-0.5">
                        Instructor's Reason:
                      </span>
                      <p className="italic text-rose-900 dark:text-rose-200 bg-rose-50/60 dark:bg-rose-900/20 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-800/60">
                        "{rejectionReason || "No specific feedback provided"}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsResubmitting(true)}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-submit with Updated Reason</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : rangeMode === "single" && isVerifiedNonAbsent ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/40 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3 pb-3 border-b border-emerald-200 dark:border-emerald-800">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
                        Verified Attendance Locked
                      </h3>
                      <p className="text-xs text-emerald-800/80 dark:text-emerald-300 font-medium">
                        This attendance record was officially verified by your instructor.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 dark:bg-slate-900/80 rounded-xl p-3.5 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Date:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{startDate}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Verified Status:</span>
                      <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs border border-emerald-300 dark:border-emerald-700 capitalize">
                        {effectiveStatus}
                      </span>
                    </div>
                    {selectedAttendance?.markedAt && (
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Marked At:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {format(new Date(selectedAttendance.markedAt), "MMM d, yyyy • hh:mm a")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Info className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                    <span>
                      Students cannot update existing verified attendance. You can only submit attendance requests for empty/unmarked dates. If there is an issue, please contact your instructor.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
            <div className="space-y-4">
              {isBeforeEnrollment && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold text-center">
                  ⚠️ Attendance marking is disabled before your enrollment date ({enrollDateStr}).
                </div>
              )}

              {/* Correction on Verified Absent Banner (Requirement 6) */}
              {rangeMode === "single" && isVerifiedAbsent && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 font-black text-amber-950 dark:text-amber-100">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Currently Marked as Absent (Verified)</span>
                  </div>
                  <p className="text-amber-900/90 dark:text-amber-300 text-[11px] leading-relaxed">
                    You can raise an issue to request an update for this date. <strong>Your record will remain officially recorded as Absent</strong> in your register and statistics until your instructor reviews and approves this update.
                  </p>
                </div>
              )}

              {/* ── DATE SELECTION FOR PAST ATTENDANCE ── */}
              {isPast && (
                <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  {rangeMode === "single" ? (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Select Past Date
                      </label>
                      <input
                        type="date"
                        max={todayStr}
                        min={enrollDateStr || undefined}
                        value={startDate}
                        disabled={isVerifiedAbsent}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setEndDate(e.target.value);
                        }}
                        className={`w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isVerifiedAbsent ? "opacity-75 cursor-not-allowed bg-slate-100 dark:bg-slate-900" : ""
                        }`}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Select Continuous Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">From Date</span>
                          <input
                            type="date"
                            max={todayStr}
                            min={enrollDateStr || undefined}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">To Date</span>
                          <input
                            type="date"
                            max={todayStr}
                            min={startDate || enrollDateStr || undefined}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Range Analysis Summary */}
                      <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Working Days to Submit:
                          </span>
                          <span className="font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs">
                            {rangeAnalysis.workingDays.length} Day(s)
                          </span>
                        </div>

                        {rangeAnalysis.skippedDays.length > 0 && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-amber-700 dark:text-amber-400">
                              ℹ️ Skipped ({rangeAnalysis.skippedDays.length}):
                            </span>{" "}
                            {rangeAnalysis.skippedDays.map((s, idx) => (
                              <span key={s.date} className="inline-block mr-1">
                                {s.date} ({s.reason}){idx < rangeAnalysis.skippedDays.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </div>
                        )}

                        {rangeAnalysis.workingDays.length === 0 && (
                          <p className="text-rose-600 font-bold text-xs pt-1">
                            ⚠️ No working days found in this range. All dates are holidays or weekends.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ATTENDANCE / LEAVE TYPE SELECTOR ── */}
              {isPast && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Attendance Status to Request <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">Choose Present or Leave Type</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {availableStatusOptions.map((opt) => {
                      const isSelected = selectedStatus === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedStatus(opt.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected ? opt.activeClass : opt.idleClass
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-mono font-black text-sm">{opt.code}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-xs block leading-tight">{opt.label}</span>
                            <span className={`text-[10px] block opacity-80 ${isSelected ? "text-white/90" : "text-slate-500 dark:text-slate-400"}`}>
                              {opt.subLabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quota Information & Alert Banner */}
                  {selectedStatus === "cl" && (
                    <div className={`p-3 rounded-xl border text-xs transition-all ${
                      isClQuotaExceeded
                        ? "bg-rose-50 border-rose-300 dark:bg-rose-950/60 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                        : "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span>Casual Leave (CL) Quota:</span>
                        <span className="font-extrabold font-mono text-xs sm:text-sm">
                          {leaveQuota.clRemaining} / 12 days remaining
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5 opacity-80 flex items-center justify-between">
                        <span>Used: {leaveQuota.clUsed || 0}d{leaveQuota.clPending ? `, Pending: ${leaveQuota.clPending}d` : ""}</span>
                        <span>Requesting: <strong>{requestedDaysCount} day(s)</strong></span>
                      </div>
                      {isClQuotaExceeded && (
                        <p className="mt-2 text-rose-700 dark:text-rose-300 font-extrabold flex items-center gap-1.5 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Cannot request {requestedDaysCount} day(s). You only have {leaveQuota.clRemaining} CL day(s) left for this year (Max 12 days/year).
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {selectedStatus === "sl" && (
                    <div className={`p-3 rounded-xl border text-xs transition-all ${
                      isSlQuotaExceeded
                        ? "bg-rose-50 border-rose-300 dark:bg-rose-950/60 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                        : "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span>Sick Leave (SL) Quota:</span>
                        <span className="font-extrabold font-mono text-xs sm:text-sm">
                          {leaveQuota.slDaysRemaining} / 15 days remaining
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5 opacity-80 flex items-center justify-between">
                        <span>Used: {leaveQuota.slDaysUsed || 0}d{leaveQuota.slDaysPending ? `, Pending: ${leaveQuota.slDaysPending}d` : ""}</span>
                        <span>Requesting: <strong>{requestedDaysCount} day(s)</strong></span>
                      </div>
                      {isSlQuotaExceeded && (
                        <p className="mt-2 text-rose-700 dark:text-rose-300 font-extrabold flex items-center gap-1.5 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Cannot request {requestedDaysCount} day(s). You only have {leaveQuota.slDaysRemaining} SL day(s) left for this year (Max 15 days/year).
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {selectedStatus === "spl" && (
                    <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 text-xs">
                      <span className="font-bold">Special Leave (SPL):</span>
                      <span className="text-[11px] block text-purple-700 dark:text-purple-300 mt-0.5">
                        Official institute-approved leave. Does not consume your annual CL or SL quota.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── PAST ATTENDANCE REASON INPUT ── */}
              {isPast && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Reason for Past Request <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">Required for instructor review</span>
                  </label>
                  <textarea
                    rows={2}
                    value={pastReason}
                    onChange={(e) => setPastReason(e.target.value)}
                    placeholder="State reason (e.g. fever, attended practicals, family emergency)..."
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                  />
                  {/* Quick Reason Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {QUICK_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setPastReason(reason)}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        + {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TODAY LOCATION & DISTANCE SECTION ── */}
              {isToday && (
                <>
                  <div className="flex items-center gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                        {locLoading ? "Getting location..." : isMarkingAllowed ? "Inside College Area" : "Outside Area"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {locationText || "Fetching specific location..."}
                      </p>
                    </div>
                    {isMarkingAllowed && !locLoading && (
                      <div className="bg-emerald-100/80 text-emerald-700 border border-emerald-200/50 text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">
                        ✓ In Range
                      </div>
                    )}
                    {!isMarkingAllowed && !locLoading && !locError && (
                      <div className="bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">
                        Out of Range
                      </div>
                    )}
                  </div>

                  {/* Distance Section */}
                  {locError ? (
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-100">
                      {locError.message}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-slate-500">Distance from institute</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {locLoading || distance === Infinity ? "..." : `${Math.round(distance)} m`}
                        </span>
                      </div>

                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full relative w-full overflow-visible">
                        {distance !== Infinity && (
                          <>
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isMarkingAllowed
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${distPercent}%` }}
                            />
                            <div
                              className="absolute top-1/2 -mt-2 w-4 h-4 bg-indigo-600 border-[3px] border-white rounded-full shadow-md transition-all duration-700"
                              style={{ left: `max(0%, min(calc(100% - 16px), ${distPercent}%))` }}
                            />
                          </>
                        )}
                      </div>

                      <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        <span>0 m</span>
                        <span className="text-emerald-600 dark:text-emerald-500">Limit: {maxRadius} m</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── ACTION BUTTONS ── */}
              <div className="pt-2 space-y-2">
                {isPast ? (
                  <button
                    id="modal-submit-past-request-btn"
                    onClick={() => handleMark()}
                    disabled={!isMarkingAllowed || isMarking}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-bold transition-all active:scale-95 ${
                      isMarkingAllowed
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 cursor-pointer"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {isMarking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isVerifiedAbsent ? "Submitting Correction Issue..." : "Submitting Request..."}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          {isVerifiedAbsent
                            ? `Raise Correction Issue (${selectedStatus.toUpperCase()})`
                            : `Submit Past Request (${rangeMode === "range" ? `${rangeAnalysis.workingDays.length} Working Days as ${selectedStatus.toUpperCase()}` : selectedStatus.toUpperCase()})`
                          }
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="modal-mark-present-btn"
                      onClick={() => handleMark("present")}
                      disabled={!isMarkingAllowed || isMarking || isPresent}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-bold transition-all active:scale-95 ${
                        isPresent
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-500/20"
                          : isMarkingAllowed && !isPresent
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-lg cursor-pointer"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {isMarking
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Check className="w-4 h-4" />
                      }
                      {isPresent ? "✓ Present" : "Mark Present"}
                    </button>

                    <button
                      id="modal-mark-absent-btn"
                      onClick={() => handleMark("absent")}
                      disabled={!isMarkingAllowed || isMarking}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-bold transition-all active:scale-95 ${
                        isAbsent
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-500/25 ring-4 ring-rose-500/20"
                          : isMarkingAllowed
                          ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 hover:shadow-lg cursor-pointer"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {isMarking
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <X className="w-4 h-4" />
                      }
                      {isAbsent ? "✗ Absent" : "Mark Absent"}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
            )
          ) : (
            /* Success State */
            <div className="mt-4 flex flex-col items-center justify-center p-8 rounded-2xl animate-in zoom-in-95 duration-300 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                Request Submitted for Instructor Verification!
              </h3>
              <p className="text-sm mt-1 font-medium text-center text-indigo-700/70 dark:text-indigo-400/70">
                {markedResult?.count > 1
                  ? `Successfully submitted ${markedResult?.count} day(s) as ${markedResult?.status.toUpperCase()} for review.`
                  : `Your request has been sent to your instructor for verification.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;
