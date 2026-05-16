import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, ShieldAlert, Navigation, Palette, CheckCircle2 } from "lucide-react";

const InstructionModal = ({ open, onOpenChange, container }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        container={container}
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-none shadow-2xl rounded-2xl p-0"
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#1a3a6b] dark:text-blue-400">
            <Info className="w-6 h-6" />
            Exam Instructions
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Please read these instructions carefully before proceeding with the examination.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Section 1: Navigation & Palette */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <Navigation className="w-4 h-4 text-blue-500" />
              1. Navigation & Palette
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Use the <strong>Question Palette</strong> on the right side to jump to any question. The status of each question is color-coded for your convenience.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {[
                { color: "bg-slate-100 dark:bg-slate-800", label: "Not Visited" },
                { color: "bg-red-100 dark:bg-red-900/30", label: "Not Answered" },
                { color: "bg-emerald-500 text-white", label: "Answered" },
                { color: "bg-purple-500 text-white", label: "Marked" },
                { color: "bg-purple-600 text-white ring-2 ring-emerald-400", label: "Ans & Marked" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded border border-slate-200 dark:border-slate-700 ${item.color}`} />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Question & Options */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <Palette className="w-4 h-4 text-purple-500" />
              2. Marking Answers
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-5">
              <li>Select an option to answer. Your choice is auto-saved instantly.</li>
              <li>Use <strong>"Mark for Review"</strong> if you're unsure; you can return later via the palette.</li>
              <li>Questions marked for review *will* be considered for evaluation if answered.</li>
            </ul>
          </section>

          {/* Section 3: Security & Anti-Cheat */}
          <section className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
              3. Security & Integrity
            </h3>
            <ul className="text-sm text-red-600 dark:text-red-400/80 space-y-2 list-disc pl-5">
              <li><strong>Tab Switching:</strong> Switching tabs or windows is strictly prohibited.</li>
              <li><strong>Full-Screen:</strong> The exam must be taken in full-screen mode.</li>
              <li><strong>Actions:</strong> Right-click, Copy, Paste, and Cut are disabled.</li>
              <li><strong>3-Strike Policy:</strong> After 3 violations, your exam will be <strong>auto-submitted</strong>.</li>
            </ul>
          </section>

          {/* Section 4: Submission */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              4. Final Submission
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Once you have attempted all questions, click <strong>"Review & Submit"</strong> in the sidebar. The timer will automatically submit your exam when time runs out.
            </p>
          </section>
        </div>

        <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl border-t border-slate-200 dark:border-slate-800">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-[#1a3a6b] hover:bg-[#15305c] text-white px-8 rounded-xl font-bold shadow-lg"
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstructionModal;
