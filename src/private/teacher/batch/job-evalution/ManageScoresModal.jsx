import React, { useState, useEffect } from "react";
import { X, UserX, Shuffle, CheckCircle2, Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

const ManageScoresModal = ({
  isOpen,
  setIsOpen,
  evaluationPoints,
  students,
  customScores,
  setCustomScores,
  jobData,
}) => {
  const [minVal, setMinVal] = useState(10);
  const [maxVal, setMaxVal] = useState(20);

  // Initialize customScores for students if not present
  useEffect(() => {
    if (isOpen && students?.length) {
      setCustomScores((prev) => {
        const next = { ...prev };
        let modified = false;
        students.forEach((std) => {
          if (!next[std.userId]) {
            modified = true;
            next[std.userId] = {
              isAbsent: std.attendanceStats ? std.attendanceStats.present === 0 : (std.total === "AB" || std.total === "-"),
              scores: { ...std.scores },
            };
          }
        });
        return modified ? next : prev;
      });
    }
  }, [isOpen, students, setCustomScores]);

  const handleScoreChange = (userId, code, val) => {
    setCustomScores((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        isAbsent: false, // Unmark absent if they start typing
        scores: {
          ...prev[userId]?.scores,
          [code]: val,
        },
      },
    }));
  };

  const toggleAbsent = (userId) => {
    setCustomScores((prev) => {
      const isCurrentlyAbsent = prev[userId]?.isAbsent;
      const newScores = { ...prev[userId]?.scores };
      
      // If marking absent, clear scores or set to "-"
      if (!isCurrentlyAbsent) {
        evaluationPoints.forEach((p) => {
          newScores[p.code] = "-";
        });
      } else {
        // If unmarking absent, set to 0 or empty to allow editing
        evaluationPoints.forEach((p) => {
          newScores[p.code] = prev[userId]?.scores[p.code] === "-" ? "" : prev[userId]?.scores[p.code];
        });
      }

      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          isAbsent: !isCurrentlyAbsent,
          scores: newScores,
        },
      };
    });
  };

  const fillRandomScores = () => {
    const min = parseInt(minVal, 10);
    const max = parseInt(maxVal, 10);
    if (isNaN(min) || isNaN(max) || min > max) {
      alert("Please enter valid min and max values.");
      return;
    }

    setCustomScores((prev) => {
      const next = { ...prev };
      students.forEach((std) => {
        const current = next[std.userId] || { isAbsent: false, scores: {} };
        if (!current.isAbsent) {
          const newScores = { ...current.scores };
          evaluationPoints.forEach((p) => {
            // Generate random between min and max (inclusive)
            newScores[p.code] = Math.floor(Math.random() * (max - min + 1)) + min;
          });
          next[std.userId] = { ...current, scores: newScores };
        }
      });
      return next;
    });
  };

  const scoreByAttendance = () => {
    const min = parseInt(minVal, 10);
    const max = parseInt(maxVal, 10);
    if (isNaN(min) || isNaN(max) || min > max) {
      alert("Please enter valid min and max values.");
      return;
    }

    setCustomScores((prev) => {
      const next = { ...prev };
      students.forEach((std) => {
        let current = next[std.userId] || { isAbsent: false, scores: {} };
        
        // Toggle present if attendance is available for that student
        if (std.attendanceStats && std.attendanceStats.present > 0) {
          current = { ...current, isAbsent: false };
        }

        // Only score if not marked absent and attendance data exists
        if (!current.isAbsent && std.attendanceStats && std.attendanceStats.total > 0) {
          const newScores = { ...current.scores };
          evaluationPoints.forEach((p) => {
            const randomBase = Math.floor(Math.random() * (max - min + 1)) + min;
            newScores[p.code] = Math.round(randomBase * std.attendanceStats.percentage);
          });
          next[std.userId] = { ...current, scores: newScores };
        } else {
          next[std.userId] = current;
        }
      });
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <DialogTitle className="text-lg font-bold flex flex-col sm:flex-row sm:items-center gap-2 text-slate-800 dark:text-slate-100 mb-2">
            <span>Manage Student Scores</span>
            {jobData && (
              <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 font-bold text-[10px] px-2 py-0.5 rounded-full w-fit">
                Job No: {jobData.number}
              </span>
            )}
          </DialogTitle>
          
          {/* Job Details Banner */}
          {jobData && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 mb-2 flex flex-col gap-1.5 border border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                {jobData.title}
              </h3>
              <div className="flex gap-4 text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {jobData.startDate ? new Date(jobData.startDate).toLocaleDateString() : "TBD"} - {jobData.endDate ? new Date(jobData.endDate).toLocaleDateString() : "TBD"}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {jobData.time || "N/A"} Hrs
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-2 items-end sm:items-center justify-between">
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
              <div className="flex flex-col">
                <label className="text-[10px] font-semibold text-slate-500 px-1">Min</label>
                <Input
                  type="number"
                  value={minVal}
                  onChange={(e) => setMinVal(e.target.value)}
                  className="w-16 h-7 text-xs"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-semibold text-slate-500 px-1">Max</label>
                <Input
                  type="number"
                  value={maxVal}
                  onChange={(e) => setMaxVal(e.target.value)}
                  className="w-16 h-7 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fillRandomScores}
                  className="h-7 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white flex gap-1.5 px-3 text-xs"
                  size="sm"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Randomize
                </Button>
                <Button
                  onClick={scoreByAttendance}
                  className="h-7 mt-4 bg-teal-600 hover:bg-teal-700 text-white flex gap-1.5 px-3 text-xs"
                  size="sm"
                  title="Calculates scores proportionally based on student attendance"
                >
                  <Calendar className="w-3.5 h-3.5" /> Score by Attendance
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs text-right mt-2 sm:mt-0">
              Randomizes or auto-scores all <span className="font-bold text-slate-700 dark:text-slate-300">present</span> students.
            </p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {students?.map((std, idx) => {
            const studentData = customScores[std.userId] || { isAbsent: false, scores: std.scores };
            const isAbsent = studentData.isAbsent;

            return (
              <div
                key={std.userId}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border ${
                  isAbsent
                    ? "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30"
                    : "bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800"
                } shadow-sm transition-colors`}
              >
                <div className="flex items-center gap-3 w-full sm:w-1/4">
                  <div className={`shrink-0 ${isAbsent ? 'opacity-50 grayscale' : ''}`}>
                    <InteractiveAvatar
                      src={std.profileImage}
                      fallbackText={std.name?.charAt(0) || "U"}
                      userId={std.userId}
                      className="w-8 h-8 rounded-full ring-2 ring-slate-100 dark:ring-slate-800"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-xs">
                      {std.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span className={isAbsent ? "text-red-500 font-medium" : "text-emerald-500 font-medium"}>
                        {isAbsent ? "Absent" : "Present"}
                      </span>
                      {std.attendanceStats && std.attendanceStats.total > 0 && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-slate-200 dark:border-slate-700">
                          Att: {std.attendanceStats.present}/{std.attendanceStats.total}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-between sm:justify-end gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {evaluationPoints?.map((p) => (
                      <div key={p.code} className="flex flex-col items-center min-w-[3.5rem]">
                        <label className="text-[9px] font-bold text-slate-500 mb-0.5" title={p.title}>
                          {p.code} ({p.marks})
                        </label>
                        <Input
                          type="text"
                          value={studentData.scores[p.code] ?? ""}
                          onChange={(e) => handleScoreChange(std.userId, p.code, e.target.value)}
                          disabled={isAbsent}
                          className={`w-14 h-7 text-center text-xs px-1 ${isAbsent ? 'opacity-50' : ''}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col items-center justify-end h-full shrink-0 ml-2">
                     <div className="h-[12px]"></div>
                     <Button
                       variant={isAbsent ? "destructive" : "outline"}
                       size="sm"
                       onClick={() => toggleAbsent(std.userId)}
                       className={`h-7 px-2 text-[10px] ${!isAbsent ? 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20' : ''}`}
                     >
                       {isAbsent ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                       {isAbsent ? "Present" : "Absent"}
                     </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-end">
          <Button onClick={() => setIsOpen(false)} className="px-8">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageScoresModal;
