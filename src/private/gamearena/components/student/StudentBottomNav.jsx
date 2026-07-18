/* eslint-disable react/prop-types */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";

export default function StudentBottomNav({
  activeTab,
  setActiveTab,
  studentTabsLeft = [],
  studentTabsRight = [],
  completedCount = 0,
  claimedCount = 0,
  setIsQuestionOpen,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-lg shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)] px-3 pt-1.5 pb-[max(0.375rem,var(--safe-bottom))] md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl md:rounded-2xl md:border md:border-slate-200/85 dark:md:border-slate-800/80 md:ring-1 md:ring-slate-200/30 dark:md:ring-slate-800/60">
      <div className="flex items-end justify-between max-w-md mx-auto relative h-12">
        {/* Left Tabs */}
        <div className="flex flex-1 justify-around items-end">
          {studentTabsLeft.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center relative py-1 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "text-pink-500 font-bold" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {/* Active dot indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavDot"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                </AnimatePresence>
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-pink-500" : "text-slate-450 dark:text-slate-500"}`} />
                <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight max-w-[52px] truncate">{tab.shortLabel || tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Play Game Button */}
        <div className="relative flex flex-col items-center justify-end px-3 -mb-1">
          {/* Outer pulsing ring glow */}
          <div className="absolute inset-0 -m-1.5 mt-auto h-14 w-14 animate-pulse rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-60 blur-md mx-auto -translate-y-3" />
          
          {/* Glowing border wrapper */}
          <div className="relative p-[3px] rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 shadow-[0_0_18px_rgba(236,72,153,0.55)] hover:shadow-[0_0_28px_rgba(236,72,153,0.75)] transition-all duration-300 -translate-y-4">
            <button
              onClick={() => {
                setIsQuestionOpen(true);
                if (activeTab !== "game") {
                  setActiveTab("game");
                }
              }}
              className="w-13 h-13 bg-slate-950 hover:bg-slate-900 border border-white/10 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group focus:outline-none"
              title="Take Mocktest / Solve MCQs"
            >
              <Play className="w-6.5 h-6.5 text-pink-500 fill-pink-500/20 group-hover:scale-125 group-hover:text-pink-400 group-hover:fill-pink-400/30 transition-all duration-300 animate-pulse ml-0.5" />
            </button>
          </div>
        </div>

        {/* Right Tabs */}
        <div className="flex flex-1 justify-around items-end">
          {studentTabsRight.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const showMissionBadge = tab.id === "missions" && completedCount > claimedCount;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center relative py-1 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "text-pink-500 font-bold" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {/* Active dot indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavDot"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                </AnimatePresence>
                <div className="relative">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-pink-500" : "text-slate-450 dark:text-slate-500"}`} />
                  {showMissionBadge && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-1 ring-slate-950 animate-pulse" />
                  )}
                </div>
                <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight max-w-[52px] truncate">{tab.shortLabel || tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
