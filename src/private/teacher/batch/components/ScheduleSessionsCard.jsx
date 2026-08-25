import React from "react";
import { Plus, Trash2, Calendar, Clock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_SESSIONS = [
  {
    id: "year1",
    name: "First Year",
    year: "FIRST",
    startDate: "",
    endDate: "",
    vacationStart: "",
    vacationEnd: "",
    status: "ACTIVE",
  },
  {
    id: "year2",
    name: "Second Year",
    year: "SECOND",
    startDate: "",
    endDate: "",
    vacationStart: "",
    vacationEnd: "",
    status: "UPCOMING",
  },
];

const ScheduleSessionsCard = ({ sessions = [], setSessions }) => {
  const activeSessions = sessions.length > 0 ? sessions : DEFAULT_SESSIONS;

  const handleAddSession = () => {
    const nextYearNum = activeSessions.length + 1;
    const newSession = {
      id: `session-${Date.now()}`,
      name: `Year ${nextYearNum}`,
      year: nextYearNum === 2 ? "SECOND" : "CUSTOM",
      startDate: "",
      endDate: "",
      vacationStart: "",
      vacationEnd: "",
      status: "UPCOMING",
    };
    setSessions([...activeSessions, newSession]);
  };

  const handleRemoveSession = (indexToRemove) => {
    if (activeSessions.length <= 1) return;
    setSessions(activeSessions.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateSession = (index, field, value) => {
    const updated = activeSessions.map((session, idx) => {
      if (idx === index) {
        return { ...session, [field]: value };
      }
      return session;
    });
    setSessions(updated);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Academic Sessions & Terms</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure multi-year terms, vacation breaks, and session schedules</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAddSession}
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-1.5 text-xs font-bold border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Session
        </Button>
      </div>

      <div className="space-y-4">
        {activeSessions.map((session, index) => (
          <div
            key={session.id || index}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={session.name || ""}
                  onChange={(e) => handleUpdateSession(index, "name", e.target.value)}
                  placeholder="Session Name (e.g. First Year)"
                  className="text-xs font-extrabold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none px-1 py-0.5"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={session.status || "ACTIVE"}
                  onChange={(e) => handleUpdateSession(index, "status", e.target.value)}
                  className="text-xs font-extrabold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>

                {activeSessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSession(index)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Remove session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-[11px]">Session Start</label>
                <input
                  type="date"
                  value={session.startDate || ""}
                  onChange={(e) => handleUpdateSession(index, "startDate", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-[11px]">Session End</label>
                <input
                  type="date"
                  value={session.endDate || ""}
                  onChange={(e) => handleUpdateSession(index, "endDate", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-[11px]">Vacation Start</label>
                <input
                  type="date"
                  value={session.vacationStart || ""}
                  onChange={(e) => handleUpdateSession(index, "vacationStart", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-[11px]">Vacation End</label>
                <input
                  type="date"
                  value={session.vacationEnd || ""}
                  onChange={(e) => handleUpdateSession(index, "vacationEnd", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleSessionsCard;
