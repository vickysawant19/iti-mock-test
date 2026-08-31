import React from "react";

const PageFallbackLoader = () => {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 transition-opacity duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer subtle glowing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 dark:border-indigo-400/10 animate-ping absolute" />
        {/* Spinning indicator */}
        <div className="w-12 h-12 rounded-full border-3 border-t-indigo-600 border-r-transparent border-b-indigo-600 border-l-transparent animate-spin dark:border-t-indigo-400 dark:border-b-indigo-400" />
      </div>
      <p className="mt-4 text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400 animate-pulse">
        Loading...
      </p>
    </div>
  );
};

export default PageFallbackLoader;
