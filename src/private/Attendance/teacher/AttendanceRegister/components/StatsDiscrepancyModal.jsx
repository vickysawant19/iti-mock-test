import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, X, ShieldAlert } from "lucide-react";
import { newAttendanceService } from "@/services/attendance/newAttendanceService";
import { toast } from "react-toastify";

const StatsDiscrepancyModal = ({
  isOpen,
  onClose,
  batchId,
  yearMonth,
  mismatches = [],
  onFixed,
}) => {
  const [isFixing, setIsFixing] = useState(false);

  if (!isOpen) return null;

  const handleFixAll = async () => {
    if (!batchId || !yearMonth || mismatches.length === 0) return;
    setIsFixing(true);
    try {
      const count = await newAttendanceService.fixBatchMonthlyStats(batchId, yearMonth, mismatches);
      toast.success(`Successfully resynced ${count} student monthly stats record(s)!`);
      if (typeof onFixed === "function") {
        await onFixed();
      }
      onClose();
    } catch (error) {
      console.error("Error fixing stats discrepancies:", error);
      toast.error("Failed to fix monthly stats discrepancies.");
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Monthly Stats Discrepancy Report
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Month: <span className="text-amber-700 dark:text-amber-400 font-bold">{yearMonth}</span> • {mismatches.length} mismatch(es) detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
            The stored pre-aggregated <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[11px] font-mono">monthlyAttendanceStats</code> documents do not match the calculated daily register logs (often caused by pre-enrollment shifts or direct database updates). Review the differences below and click <strong>Fix Discrepancies</strong> to resync.
          </p>
        </div>

        {/* List of Mismatches */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {mismatches.map((m, idx) => (
            <div
              key={m.userId || idx}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2.5">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {m.userName} <span className="text-slate-400 font-normal">({m.rollNumber})</span>
                  </h4>
                  {m.enrollmentDate && (
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Enrollment Date: <span className="font-semibold text-blue-600 dark:text-blue-400">{m.enrollmentDate}</span>
                    </p>
                  )}
                </div>
                <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-[10px] rounded-full uppercase tracking-wider">
                  Mismatch
                </span>
              </div>

              {/* Comparison Table */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Stored Stats */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Stored in Database
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Working Days:</span>
                    <span className="font-bold line-through text-rose-500">{m.stored.workingDays}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Present Days:</span>
                    <span className="font-bold line-through text-rose-500">{m.stored.presentDays}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Attendance %:</span>
                    <span className="font-bold line-through text-rose-500">{m.stored.percentage}%</span>
                  </div>
                </div>

                {/* Actual Computed Stats */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Actual Daily Records
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Working Days:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.actual.workingDays}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Present Days:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.actual.presentDays}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Attendance %:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.actual.percentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isFixing}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleFixAll}
            disabled={isFixing}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isFixing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Resyncing Stats...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Fix Discrepancies ({mismatches.length})
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default StatsDiscrepancyModal;
