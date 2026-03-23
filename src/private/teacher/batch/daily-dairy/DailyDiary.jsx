import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { Edit, Save, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import dailyDiaryService from "@/appwrite/dailyDiaryService";
import Loader from "@/components/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import InstructorDailyDiary from "./InstructorDailyDiary";
import StudentDailyDiary from "./StudentDailyDiary";
import DiaryWeekView from "./DiaryWeekView";
import { useWeeklyDiaryData } from "./useWeeklyDiaryData";

function DailyDiary() {
  const user = useSelector(selectUser);
  const isTeacher = user.labels.includes("Teacher");

  return isTeacher ? <TeacherDiaryView /> : <StudentDailyDiary />;
}

function TeacherDiaryView() {
  const [activeTab, setActiveTab] = useState("monthly");
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
            theoryWork: "",
            practicalWork: "",
            practicalNumbers: [],
            remarks: "",
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
      const dateISO = new Date(dateKey).toISOString();
      const updatedEntry = { ...entry, isEditing: false };

      if (entry.$id) {
        await dailyDiaryService.updateDocument(entry.$id, {
          theoryWork: entry.theoryWork || "",
          practicalWork: entry.practicalWork || "",
          practicalNumbers: entry.practicalNumbers || [],
          remarks: entry.remarks || "-",
        });
      } else {
        const newDoc = await dailyDiaryService.createDocument({
          date: dateISO,
          theoryWork: entry.theoryWork || "",
          practicalWork: entry.practicalWork || "",
          practicalNumbers: entry.practicalNumbers || [],
          extraWork: "-",
          hours: null,
          remarks: entry.remarks || "-",
          instructorId: profile.userId,
          batchId: profile.batchId,
        });
        updatedEntry.$id = newDoc.$id;
      }

      const updatedDiaryData = {
        ...diaryData,
        [dateKey]: updatedEntry,
      };
      
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
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 space-y-4">
        
        {/* Sticky Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Daily Diary
          </h1>
          <div className="flex flex-row flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("monthly")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                activeTab === "monthly"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveTab("weekly")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                activeTab === "weekly"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Content Render */}
        <div className="mt-4 animate-in fade-in duration-500">
          {activeTab === "monthly" ? (
            <div className="w-full space-y-4">
              <InstructorDailyDiary />
            </div>
          ) : (
            <div className="w-full space-y-4">
              <Card className="rounded-xl shadow-sm border-gray-200 dark:border-gray-800">
                <CardHeader className="py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Button variant="outline" size="sm" onClick={handlePreviousWeek} disabled={weekNumber <= 1} className="w-full sm:w-auto">
                      <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                    </Button>
                    <Badge variant="secondary" className="text-base px-6 py-2 shadow-sm shrink-0">
                      Week {weekNumber}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleNextWeek} className="w-full sm:w-auto">
                      Next <ChevronRight className="h-4 w-4 ml-2" />
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
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyDiary;
