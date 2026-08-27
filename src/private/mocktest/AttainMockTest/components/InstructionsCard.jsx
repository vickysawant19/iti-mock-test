import React from "react";
import { Info, CheckCircle, Wifi, PlayCircle, Clock } from "lucide-react";

const InstructionsCard = () => {
  const items = [
    { icon: Info, text: "Enter the Paper ID code shared by your trade instructor." },
    { icon: Wifi, text: "Ensure a stable internet connection before launching the test." },
    { icon: PlayCircle, text: "Once generated, your timed session will begin immediately." },
    { icon: Clock, text: "Attempt all questions and click Submit before time expires." },
  ];

  return (
    <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Important Instructions</span>
      </h3>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <Icon className="w-3.5 h-3.5 text-indigo-500/80 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span>{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default InstructionsCard;
