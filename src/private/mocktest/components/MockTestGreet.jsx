import React from "react";
import { Clock, Award, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import itimitraLogo from "@/assets/itimitra-logo.png";

const MockTestGreet = ({ mockTest, handleStartExam, onShowInstructions }) => {
  const [accepted, setAccepted] = React.useState(false);

  function toHoursAndMinutes(totalMinutes = 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  }

  return (
    <div className="h-full w-full flex-grow bg-slate-50 dark:bg-slate-950 overflow-y-auto font-sans">
      {/* ── Top Branding Strip ── */}
      <div className="bg-[#1a3a6b] text-white py-3 px-6 flex items-center justify-between shadow-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white p-0.5 shadow-md">
            <img src={itimitraLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">ITI MITRA MOCK TEST</h1>
        </div>
        <div className="hidden sm:block text-[10px] font-bold uppercase tracking-widest opacity-60">
          Electronic Examination Portal
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* ── Paper Info Card ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {mockTest?.name || "Mock Test Assessment"}
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-[10px] font-bold uppercase text-blue-500 tracking-wider">Duration</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{toHoursAndMinutes(mockTest?.totalMinutes)}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider">Questions</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{mockTest?.questions?.length || 0} Nos.</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30">
              <Award className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-[10px] font-bold uppercase text-purple-500 tracking-wider">Total Marks</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{(mockTest?.questions?.length || 0) * 1}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary Instructions ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Important Instructions</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {[
              "The exam will be auto-submitted once the timer reaches zero.",
              "Tab switching or minimizing the browser will lead to security strikes.",
              "Three security strikes will result in immediate auto-submission.",
              "You can mark questions for review and return to them later.",
              "Do not use browser Refresh or Back buttons during the test.",
              "Ensure you have a stable internet connection for auto-save.",
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={onShowInstructions}
              className="w-full sm:w-auto flex items-center gap-2 border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl px-6"
            >
              <AlertCircle className="w-4 h-4" />
              View Full Instructions
            </Button>
            <p className="text-xs text-slate-400 text-center sm:text-left">
              Click the button above to read the detailed examination policy and color-code legends.
            </p>
          </div>
        </div>

        {/* ── Acceptance & Action ── */}
        <div className="flex flex-col items-center space-y-6 pt-4 pb-12">
          <label className="flex items-start gap-3 max-w-2xl cursor-pointer group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded-md border-slate-300 text-[#1a3a6b] focus:ring-[#1a3a6b] cursor-pointer"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400 select-none group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
              I have read and understood all the instructions. I agree that I will not use any unfair means during the examination. I am aware that any breach of conduct may lead to disqualification.
            </span>
          </label>

          <Button
            disabled={!accepted}
            onClick={handleStartExam}
            className={`
              w-full sm:w-80 py-6 rounded-2xl text-lg font-bold shadow-xl transition-all duration-300
              ${accepted
                ? "bg-[#1a3a6b] hover:bg-[#15305c] text-white scale-100"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 scale-95 opacity-60 cursor-not-allowed"
              }
            `}
          >
            {mockTest?.startTime ? "RESUME EXAMINATION" : "I AM READY TO BEGIN"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MockTestGreet;
