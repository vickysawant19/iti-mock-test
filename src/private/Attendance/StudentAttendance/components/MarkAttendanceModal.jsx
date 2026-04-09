import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Check, X, MapPin, Loader2 } from "lucide-react";
import useLocationManager from "@/hooks/useLocationManager";

const MarkAttendanceModal = ({ 
  isOpen, 
  onClose, 
  batchData, 
  onMarkAttendance,
  todayAttendance
}) => {
  const [isMarking, setIsMarking] = useState(false);
  const [success, setSuccess] = useState(false);

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
  
  // Calculate percentage for progress bar (cap at 100%)
  const distPercent = Math.min((distance / maxRadius) * 100, 100);

  const handleMark = async () => {
    if (!isMarkingAllowed) return;
    setIsMarking(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      await onMarkAttendance(today, "present", locationText || "Marked from student app");
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden translate-y-0 animate-in slide-in-from-bottom flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden" />
          
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Mark Attendance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verify your location to mark today's attendance
          </p>

          {!success ? (
            <div className="mt-6 space-y-5">
              {/* Location Block */}
              <div className="flex items-center gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl">
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-500">Distance from institute</span>
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
                            isMarkingAllowed ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-rose-500"
                          }`}
                          style={{ width: `${distPercent}%` }}
                        />
                        <div 
                          className="absolute top-1/2 -mt-2 w-4 h-4 bg-indigo-600 border-[3px] border-white rounded-full shadow-md transition-all duration-700"
                          style={{ left: `max(0%, min(100%, ${distPercent}%))` }}
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

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleMark}
                  disabled={!isMarkingAllowed || isMarking || todayAttendance?.status === 'present'}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    todayAttendance?.status === 'present'
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : isMarkingAllowed 
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 hover:opacity-90 active:scale-95"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isMarking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {todayAttendance?.status === 'present' ? "Already Marked Today" : "Mark Present Now"}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center p-8 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl animate-in zoom-in-95 duration-300">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">Marked Present!</h3>
              <p className="text-sm text-emerald-700/70 dark:text-emerald-500/70 mt-1 font-medium text-center">
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
