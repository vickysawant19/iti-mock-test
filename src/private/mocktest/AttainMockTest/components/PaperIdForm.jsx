import React from "react";
import { Loader2, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PaperIdForm = ({ paperId, setPaperId, loading, onSubmit }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Enter Paper ID
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste the unique exam paper code provided by your instructor
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="paperId"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            Paper ID Code
          </label>
          <Input
            type="text"
            id="paperId"
            value={paperId}
            onChange={(e) => setPaperId(e.target.value)}
            className="w-full font-mono text-sm tracking-widest uppercase bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/40"
            placeholder="e.g. 64B8... or EM-2026"
            required
            autoFocus
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching Paper Questions...</span>
            </>
          ) : (
            <>
              <span>Generate & Begin Exam</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default PaperIdForm;
