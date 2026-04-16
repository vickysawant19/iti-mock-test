import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Check, X, MapPin, Loader2 } from "lucide-react";
import useLocationManager from "@/hooks/useLocationManager";

const MarkAttendanceModal = ({ 
  isOpen, 
  onClose, 
  batchData, 
  onMarkAttendance,
  selectedDate,
  selectedAttendance,
  todayAttendance
}) => {
  const [isMarking, setIsMarking] = useState(false);
  const [markedStatus, setMarkedStatus] = useState(null);

  const { deviceLocation, locationText, loading: locLoading, error: locError, calculateDistance } = useLocationManager(false);

  const distance = useMemo(() => {
    if (!deviceLocation || !batchData?.location) return Infinity;
    return calculateDistance(
      deviceLocation.lat,
      deviceLocation.lon,
      batchData.location.lat,
      batchData.location.lon
    );
  }, [deviceLocation, batchData?.location, calculateDistance]);

  const maxRadius = batchData?.circleRadius || 1000;
  const isMarkingAllowed = distance !== Infinity && distance <= maxRadius;
  const distPercent = Math.min((distance / maxRadius) * 100, 100);

  const targetDate = selectedDate || format(new Date(), "yyyy-MM-dd");
  const isToday = targetDate === format(new Date(), "yyyy-MM-dd");
  const currentStatus = String(selectedAttendance?.status || "").toLowerCase();
  const todayStatus = String(todayAttendance?.status || "").toLowerCase();

  // Use todayAttendance for today, selectedAttendance otherwise
  const effectiveStatus = isToday ? todayStatus : currentStatus;
  const isPresent = effectiveStatus === "present";
  const isAbsent  = effectiveStatus === "absent";
  const isLeave   = effectiveStatus === "leave";

  const handleMark = async (targetStatus) => {
    if (!isMarkingAllowed || isMarking) return;
    // For today, don't re-mark if already present
    if (isToday && isPresent && targetStatus === "present") return;
    setIsMarking(true);
    try {
      await onMarkAttendance(
        targetDate,
        targetStatus,
        locationText || `Marked from student app (${targetDate})`
      );
      setMarkedStatus(targetStatus);
      setTimeout(() => {
        onClose();
        setMarkedStatus(null);
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarking(false);
    }
  };

  if (!isOpen) return null;

  const showSuccess = markedStatus !== null;

  const statusBadgeClass = isPresent
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
    : isAbsent
    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
    : isLeave
    ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800"
    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300";

  const dotClass = isPresent
    ? "bg-emerald-500"
    : isAbsent
    ? "bg-rose-500"
    : isLeave
    ? "bg-violet-500"
    : "bg-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden translate-y-0 animate-in slide-in-from-bottom flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-6">
          {/* Drag handle (mobile) */}
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden" />

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Mark Attendance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verify your location to mark attendance for {targetDate}
          </p>

          {/* Current status badge */}
          <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold border ${statusBadgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            Current: <span className="capitalize">{effectiveStatus || "not marked"}</span>
          </div>

          {!showSuccess ? (
            <div className="mt-5 space-y-4">
              {/* Location Block */}
              <div className="flex items-center gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate">
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

                  {/* Progress Bar */}
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

              {/* ── Action Buttons ── */}
              <div className="pt-1 space-y-2">
                {/* Present + Absent side by side */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="modal-mark-present-btn"
                    onClick={() => handleMark("present")}
                    disabled={!isMarkingAllowed || isMarking || (isToday && isPresent)}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-bold transition-all active:scale-95 ${
                      isPresent
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-500/20"
                        : isMarkingAllowed && !(isToday && isPresent)
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-lg"
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
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 hover:shadow-lg"
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

                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className={`mt-6 flex flex-col items-center justify-center p-8 rounded-2xl animate-in zoom-in-95 duration-300 ${
              markedStatus === "present"
                ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30"
                : "bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30"
            }`}>
              <div className="text-4xl mb-4">{markedStatus === "present" ? "🎉" : "📋"}</div>
              <h3 className={`text-lg font-extrabold ${
                markedStatus === "present"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}>
                Marked {markedStatus === "present" ? "Present" : "Absent"}!
              </h3>
              <p className={`text-sm mt-1 font-medium text-center ${
                markedStatus === "present"
                  ? "text-emerald-700/70 dark:text-emerald-500/70"
                  : "text-rose-700/70 dark:text-rose-500/70"
              }`}>
                {format(new Date(), "MMMM do, yyyy")} · {format(new Date(), "hh:mm a")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;
