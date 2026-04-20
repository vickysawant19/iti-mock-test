import React from "react";
import { Plus, Search, Users, ClipboardList, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * NoBatchTeacherView
 * 
 * A reusable placeholder component for pages that require an active batch.
 * It provides a premium-looking UI with a clear Call to Action (CTA) to create a batch.
 */
const NoBatchTeacherView = ({ isTeacher = true }) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[70vh] w-full flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/5 blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-xl mx-auto w-full">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-10 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-pink-100/80 dark:bg-pink-900/30 flex items-center justify-center mx-auto transition-transform hover:scale-110 duration-300">
            {isTeacher ? (
              <Plus className="w-10 h-10 text-pink-600 dark:text-pink-400" />
            ) : (
              <Search className="w-10 h-10 text-pink-600 dark:text-pink-400" />
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isTeacher ? "Create Your Batch" : "No Batch Joined"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm leading-relaxed font-medium">
              {isTeacher
                ? "Start managing your class today. Create a batch to unlock attendance tracking, student analytics, and daily diary records."
                : "You haven't joined any batch yet. To access courses and mark attendance, you first need to join a batch."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-slate-400 dark:text-slate-500 py-4 opacity-80">
            <div className="flex flex-col items-center gap-2 transition-transform hover:scale-110">
              <div className="p-3 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <Users className="w-5 h-5 flex-shrink-0 text-blue-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Students</span>
            </div>
            <div className="w-8 md:w-12 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
            <div className="flex flex-col items-center gap-2 transition-transform hover:scale-110 hover:delay-75">
              <div className="p-3 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <ClipboardList className="w-5 h-5 flex-shrink-0 text-amber-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Attendance</span>
            </div>
            <div className="w-8 md:w-12 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
            <div className="flex flex-col items-center gap-2 transition-transform hover:scale-110 hover:delay-150">
              <div className="p-3 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <TrendingUp className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Progress</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => navigate(isTeacher ? "/manage-batch/create" : "/browse-batches")}
              size="lg"
              className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white rounded-2xl px-10 h-14 text-lg shadow-xl shadow-pink-500/25 font-bold transition-all hover:-translate-y-1 hover:shadow-pink-500/40 active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center gap-2">
                {isTeacher ? "Create First Batch" : "Browse Batches"}
                <Plus className={`w-5 h-5 ${isTeacher ? '' : 'hidden'}`} />
              </span>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NoBatchTeacherView;
