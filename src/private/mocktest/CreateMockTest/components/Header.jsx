import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Save, FileText, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ isSubmitting }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-none p-3 sm:p-4 text-white shadow-xs border-b border-blue-400/30 dark:border-indigo-500/20 m-0">
      {/* Ambient background glow orbs */}
      <div className="absolute top-[-70px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-30px] w-[160px] h-[160px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-5xl mx-auto px-1 sm:px-2">
        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/15 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 shrink-0">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
              Create Mock Exam
            </h1>
            <p className="text-[11px] sm:text-xs text-blue-100/90 dark:text-slate-400">
              Configure parameters, select subjects or modules, and generate a customized mock exam paper.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Link
            to="/all-mock-tests"
            className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-xs transition-all border border-white/30 dark:border-slate-700 flex items-center justify-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Exams</span>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xs transition-all shadow-xs border border-amber-300 flex items-center justify-center gap-1.5 h-auto cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Generate Test</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
