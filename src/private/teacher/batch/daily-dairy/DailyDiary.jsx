import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { Edit, Save, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import batchService from "@/appwrite/batchService";
import Loader from "@/components/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import InstructorDailyDiary from "./InstructorDailyDiary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentDailyDiary from "./StudentDailyDiary";
import DiaryWeekView from "./DiaryWeekView";
import { useWeeklyDiaryData } from "./useWeeklyDiaryData";

function DailyDiary() {
  const user = useSelector(selectUser);
  const isTeacher = user.labels.includes("Teacher");

  return isTeacher ? <TeacherDiaryView /> : <StudentDailyDiary />;
}

function TeacherDiaryView() {
  const [activeTab, setActiveTab] = useState("daily");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setDiaryData,
  } = useWeeklyDiaryData();

  const updateDiaryField = useCallback(
    (dateKey, field, value) => {
      setDiaryData((prev) => ({
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {
            theory: "",
            practical: "",
            practicalNumber: "",
            isEditing: true,
          }),
          [field]: value,
        },
      }));
    },
    [setDiaryData]
  );

  const handleSubmit = async (dateKey) => {
    const entry = diaryData[dateKey];
    if (!entry) return;

    setIsSubmitting(true);
    try {
      const updatedDiaryData = {
        ...diaryData,
        [dateKey]: { ...entry, isEditing: false },
      };
      const stringyfiedData = Object.entries(updatedDiaryData).map((itm) =>
        JSON.stringify(itm)
      );
      await batchService.updateBatch(profile.batchId, {
        dailyDairy: stringyfiedData,
      });
      setDiaryData(updatedDiaryData);
      toast.success("Diary entry saved successfully");
    } catch (error) {
      console.error("Failed to save diary entry:", error);
      toast.error("Failed to save diary entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEditing = useCallback(
    (dateKey) => {
      const currentEntry = diaryData[dateKey] || {
        isEditing: true,
      };

      if (currentEntry.isEditing) {
        handleSubmit(dateKey);
      } else {
        setDiaryData((prev) => ({
          ...prev,
          [dateKey]: {
            ...currentEntry,
            isEditing: true,
          },
        }));
      }
    },
    [diaryData, setDiaryData]
  );

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily Diary</TabsTrigger>
          <TabsTrigger value="instructor">Instructor Diary</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <div className="max-w-7xl mx-auto space-y-6 mt-4">
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
              isTeacher={true}
              isSubmitting={isSubmitting}
              updateDiaryField={updateDiaryField}
              toggleEditing={toggleEditing}
            />
          </div>
        </TabsContent>
        <TabsContent value="instructor">
          <div className="max-w-7xl mx-auto space-y-6 mt-4">
            <InstructorDailyDiary />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DailyDiary;
