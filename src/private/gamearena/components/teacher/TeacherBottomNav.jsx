/* eslint-disable react/prop-types */
import React from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Target, Award, Settings } from "lucide-react";

export default function TeacherBottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "attendance", label: "Attendance & Stats", shortLabel: "Attendance", icon: Users },
    { id: "leaderboard", label: "Leaderboard & Stats", shortLabel: "Leaderboard", icon: Trophy },
    { id: "challenges", label: "Launch Challenges", shortLabel: "Challenges", icon: Target },
    { id: "prizes", label: "Dispatch Prizes", shortLabel: "Prizes", icon: Award },
    { id: "settings", label: "Game Settings", shortLabel: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-lg shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)] px-3 pt-1.5 pb-[max(0.375rem,var(--safe-bottom))] md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl md:rounded-2xl md:border md:border-slate-200/80 dark:md:border-slate-800/80 md:ring-1 md:ring-slate-200/30 dark:md:ring-slate-800/60">
      <div className="flex items-center justify-around gap-1 relative h-12 max-w-xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center relative py-1 px-1 md:px-3 rounded-xl transition-all duration-200 cursor-pointer flex-1 min-w-0 ${
                isActive
                  ? "text-pink-600 dark:text-pink-500 font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? "text-pink-600 dark:text-pink-500" : "text-slate-450 dark:text-slate-500"}`} />
              <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight hidden md:block">{tab.label}</span>
              <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight block md:hidden max-w-[80px] truncate">{tab.shortLabel}</span>
              {isActive && (
                <motion.div
                  layoutId="teacherBottomTabDot"
                  className="w-4 h-1 bg-pink-600 dark:bg-pink-500 rounded-full mt-0.5 absolute -top-0.5 left-1/2 -translate-x-1/2"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
