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
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
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
            <Badge variant="secondary" className="text-base px-4 py-2">
              Week {weekNumber}
            </Badge>
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
  );
}

export default StudentDailyDiary;
