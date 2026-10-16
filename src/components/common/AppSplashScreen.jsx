import React from "react";

const AppSplashScreen = ({ message }) => {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* Brand Logo with Ambient Pulse Ring */}
      <div className="relative flex items-center justify-center mb-4">
        <div className="absolute w-[115px] h-[115px] rounded-full bg-blue-500/10 dark:bg-blue-400/15 animate-[itipulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
        <img
          src="/icons/icon-192x192.png"
          alt="ITI Mitra Logo"
          className="w-20 h-20 rounded-[18px] shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 relative z-10 object-contain bg-white dark:bg-slate-900 p-1 border border-slate-100 dark:border-slate-800"
        />
      </div>

      {/* Brand Title */}
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
        ITI Mitra
      </h1>

      {/* Platform Subtitle */}
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide mb-5">
        Online Practice Exams & Attendance
      </p>

      {/* Polished Spinner */}
      <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-400 animate-spin mb-3" />

      {/* Optional Context Message */}
      {message && (
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default AppSplashScreen;
