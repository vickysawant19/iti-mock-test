import React from "react";
import { useFormContext } from "react-hook-form";
import { Book, Layers } from "lucide-react";

export function ModeSelector() {
  const { watch, setValue } = useFormContext();
  const currentMode = watch("mode");

  const modes = [
    { id: "subject", label: "Subject Based Exam", icon: Book, desc: "Generate questions across an entire subject syllabus" },
    { id: "module",  label: "Module Based Exam",  icon: Layers, desc: "Pick specific learning modules or topics" },
  ];

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        1. Select Exam Mode
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          
          return (
            <div
              key={mode.id}
              onClick={() => setValue("mode", mode.id)}
              className={`
                cursor-pointer rounded-xl border p-4 transition-all duration-200 
                flex items-center gap-3.5 shadow-xs
                ${isActive 
                  ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20" 
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800"
                }
              `}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? "bg-indigo-600 text-white shadow-2xs" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-black ${isActive ? "text-indigo-900 dark:text-indigo-200" : "text-slate-900 dark:text-slate-100"}`}>
                  {mode.label}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {mode.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ModeSelector;
