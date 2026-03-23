import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Loader from "@/components/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DiaryWeekView from "./DiaryWeekView";
import { useWeeklyDiaryData } from "./useWeeklyDiaryData";

function StudentDailyDiary() {
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
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 space-y-4">
        
        {/* Sticky Header Mimicking Teacher View */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Student Diary
          </h1>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
             <Badge variant="secondary" className="text-base px-6 py-2 shadow-sm shrink-0">
               Week {weekNumber}
             </Badge>
          </div>
        </div>

        <Card className="rounded-xl shadow-sm border-gray-200 dark:border-gray-800">
          <CardHeader className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                disabled={weekNumber <= 1}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                className="w-full sm:w-auto"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
        </Card>

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
