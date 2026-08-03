import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DiaryPeriodNav = React.memo(({
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
  label,
}) => {
  return (
    <div className="flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 sm:p-3 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 mb-5 sticky top-4 z-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={!canPrevious}
        className="flex-1 sm:flex-none justify-start px-2 sm:px-4 active:scale-95 transition-transform hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
      >
        <ChevronLeft className="h-5 w-5 sm:mr-1" />
        <span className="hidden sm:inline font-bold text-xs">Previous</span>
      </Button>
      <div className="px-2 sm:px-6 text-center font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 whitespace-nowrap">
        {label}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={!canNext}
        className="flex-1 sm:flex-none justify-end px-2 sm:px-4 active:scale-95 transition-transform hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
      >
        <span className="hidden sm:inline font-bold text-xs">Next</span>
        <ChevronRight className="h-5 w-5 sm:ml-1" />
      </Button>
    </div>
  );
});

export default DiaryPeriodNav;
