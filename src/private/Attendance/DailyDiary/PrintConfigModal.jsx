import React, { useState } from "react";
import { Printer, X, Settings2, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Column definitions with labels and keys
const COLUMN_OPTIONS = [
  { key: "srNo",           label: "Sr. No.",           group: "basic",    defaultOn: true  },
  { key: "date",           label: "Date",               group: "basic",    defaultOn: true  },
  { key: "day",            label: "Day (Mon/Tue…)",     group: "basic",    defaultOn: false },
  { key: "theoryTopic",    label: "Theory Topic",       group: "theory",   defaultOn: true  },
  { key: "theoryHours",    label: "Theory Hours",       group: "theory",   defaultOn: true  },
  { key: "practicalTopic", label: "Practical Topic",    group: "practical",defaultOn: true  },
  { key: "practicalNos",   label: "Practical No.",      group: "practical",defaultOn: false },
  { key: "practicalHours", label: "Practical Hours",    group: "practical",defaultOn: true  },
  { key: "combinedHours",  label: "Combined Hours",     group: "combined", defaultOn: false },
  { key: "extraWork",      label: "Extra Work",         group: "extra",    defaultOn: false },
  { key: "remarks",        label: "Remarks",            group: "extra",    defaultOn: false },
  { key: "instrSign",      label: "Instructor Sign",    group: "extra",    defaultOn: true  },
];

export const DEFAULT_PRINT_CONFIG = Object.fromEntries(
  COLUMN_OPTIONS.map((c) => [c.key, c.defaultOn])
);

const GROUP_LABELS = {
  basic:     { label: "Basic Info",       color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  theory:    { label: "Theory",           color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  practical: { label: "Practical",        color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  combined:  { label: "Combined",         color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  extra:     { label: "Extra / Misc",     color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

export default function PrintConfigModal({ isOpen, onClose, onPrint }) {
  const [config, setConfig] = useState({ ...DEFAULT_PRINT_CONFIG });

  if (!isOpen) return null;

  const toggle = (key) => {
    // Mutual exclusion: combinedHours ↔ (theoryHours + practicalHours)
    setConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === "combinedHours" && next.combinedHours) {
        next.theoryHours = false;
        next.practicalHours = false;
      }
      if ((key === "theoryHours" || key === "practicalHours") && next[key]) {
        next.combinedHours = false;
      }
      return next;
    });
  };

  const handlePrint = () => {
    onPrint(config);
    onClose();
  };

  const enableAll = () =>
    setConfig(Object.fromEntries(COLUMN_OPTIONS.map((c) => [c.key, true])));
  const reset = () =>
    setConfig({ ...DEFAULT_PRINT_CONFIG });

  // Group columns
  const groups = ["basic", "theory", "practical", "combined", "extra"];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-5 h-5 opacity-90" />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest opacity-80">Daily Diary</div>
              <div className="text-base font-extrabold leading-tight">Customise Print Report</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hours mode hint */}
        <div className="px-5 pt-4 pb-1">
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            <span className="text-base leading-none mt-0.5">💡</span>
            <span>
              <strong>Combined Hours</strong> replaces separate Theory & Practical hours columns.
              Enabling one auto-disables the other.
            </span>
          </div>
        </div>

        {/* Column toggles */}
        <div className="px-5 py-3 max-h-[55vh] overflow-y-auto space-y-4 scrollbar-thin">
          {groups.map((group) => {
            const cols = COLUMN_OPTIONS.filter((c) => c.group === group);
            const { label, color } = GROUP_LABELS[group];
            return (
              <div key={group}>
                <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${color}`}>
                  {label}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {cols.map((col) => {
                    const active = config[col.key];
                    return (
                      <button
                        key={col.key}
                        onClick={() => toggle(col.key)}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 select-none ${
                          active
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        <span className="truncate">{col.label}</span>
                        {active ? (
                          <Eye className="w-4 h-4 flex-shrink-0 text-blue-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Reset
            </button>
            <button
              onClick={enableAll}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              Select All
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl font-bold border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm gap-2"
            >
              <Printer className="w-4 h-4" />
              Print PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
