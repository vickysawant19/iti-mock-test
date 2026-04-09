import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";

import Loader from "@/components/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DiaryWeekView from "./DiaryWeekView";
import { useWeeklyDiaryData } from "./useWeeklyDiaryData";
import { avatarFallback } from "@/utils/avatarFallback";

function StudentDailyDiary() {
  const profile = useSelector(selectProfile);
  const {
    weekDays,
    weekNumber,
    diaryData,
    attendance,
    holidays,
    isLoading,
    isError,
    handlePreviousWeek,
    handleNextWeek,
    batchData,
  } = useWeeklyDiaryData();

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600 dark:text-red-400">
              Failed to load diary data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        
        {/* Beautiful Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 rounded-t-[22px] p-5 sm:p-6 text-white shadow-none">
          <div className="absolute top-[-80px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[160px] h-[160px] rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 border-2 border-white/30 rounded-[14px] flex items-center justify-center font-extrabold text-lg flex-shrink-0 overflow-hidden">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  avatarFallback(profile?.userName || profile?.name || "Student")
                )}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Student Portal</div>
                <h1 className="text-xl sm:text-2xl font-extrabold leading-tight shadow-sm">My Diary</h1>
                <div className="text-xs text-white/80 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{profile?.userName || profile?.name || "Student"}</span>
                  {profile?.studentId && (
                    <>
                      <span className="opacity-50">·</span>
                      <span>ID: {profile.studentId}</span>
                    </>
                  )}
                  {batchData?.BatchName && (
                    <>
                      <span className="opacity-50">·</span>
                      <span>{batchData.BatchName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Navigation */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 sm:p-3 rounded-b-[22px] shadow-lg border border-gray-200 dark:border-gray-800 border-t-0 mb-6 sticky top-4 z-20">
          <Button variant="ghost" size="sm" onClick={handlePreviousWeek} disabled={weekNumber <= 1} className="flex-1 sm:flex-none justify-start px-2 sm:px-4 active:scale-95 transition-transform hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft className="h-5 w-5 sm:mr-1" /> <span className="hidden sm:inline font-bold">Previous</span>
          </Button>
          <div className="px-2 sm:px-6 text-center font-extrabold text-sm sm:text-base text-gray-800 dark:text-gray-100 whitespace-nowrap">
            Week {weekNumber}
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextWeek} className="flex-1 sm:flex-none justify-end px-2 sm:px-4 active:scale-95 transition-transform hover:bg-gray-100 dark:hover:bg-gray-800">
            <span className="hidden sm:inline font-bold">Next</span> <ChevronRight className="h-5 w-5 sm:ml-1" />
          </Button>
        </div>

        <DiaryWeekView
          weekDays={weekDays}
          diaryData={diaryData}
          attendance={attendance}
          holidays={holidays}
          isLoading={isLoading}
          isTeacher={false}
        />
      </div>
    </div>
  );
}

export default StudentDailyDiary;
