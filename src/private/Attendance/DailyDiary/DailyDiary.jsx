import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { Edit, Save, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import { selectActiveBatchId } from "@/store/activeBatchSlice";
import dailyDiaryService from "@/appwrite/dailyDiaryService";
import Loader from "@/components/components/Loader";
import { avatarFallback } from "@/utils/avatarFallback";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import InstructorDailyDiary from "./InstructorDailyDiary";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import StudentDailyDiary from "./StudentDailyDiary";
import DiaryWeekView from "./DiaryWeekView";
import { useDiaryData } from "./useDiaryData";

function DailyDiary() {
  const user = useSelector(selectUser);
  const isTeacher = user.labels.includes("Teacher");

  return isTeacher ? <TeacherDiaryView /> : <StudentDailyDiary />;
}

function TeacherDiaryView() {
  const [activeTab, setActiveTab] = useState("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector(selectActiveBatchId);
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
    dailyDateLabel,
    canGoPreviousPeriod,
    batchData,
  } = useDiaryData({
    viewType: activeTab === "daily" ? "daily" : "weekly",
    role: "teacher",
    enabled: activeTab !== "monthly",
  });

  const updateDiaryField = useCallback(
    (dateKey, field, value) => {
      setDiaryData((prev) => ({
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {
            theoryWork: "",
            practicalWork: "",
            practicalNumbers: "", // Start tracking as string for smooth typing
            extraWork: "",
            hours: "",
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
      const rawPractical = entry.practicalNumbers;
      const parsedPractical = typeof rawPractical === "string" 
         ? rawPractical.split(",").map(v => v.trim()).filter(Boolean)
         : Array.isArray(rawPractical) ? rawPractical : [];
         
      let updatedEntry = { ...entry, isEditing: false };
      updatedEntry.practicalNumbers = parsedPractical;

      if (entry.$id) {
        await dailyDiaryService.updateDocument(entry.$id, {
          theoryWork: entry.theoryWork || "",
          practicalWork: entry.practicalWork || "",
          practicalNumbers: parsedPractical,
          extraWork: entry.extraWork || "",
          hours: entry.hours ? Number(entry.hours) : null,
          remarks: entry.remarks || "-",
        });
      } else {
        const newDoc = await dailyDiaryService.createDocument({
          date: dateISO,
          theoryWork: entry.theoryWork || "",
          practicalWork: entry.practicalWork || "",
          practicalNumbers: parsedPractical,
          extraWork: entry.extraWork || "-",
          hours: entry.hours ? Number(entry.hours) : null,
          remarks: entry.remarks || "-",
          instructorId: profile.userId,
          batchId: activeBatchId,
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
        isEditing: false,
      };

      if (currentEntry.isEditing) {
        handleSubmit(dateKey);
      } else {
        setDiaryData((prev) => ({
          ...prev,
          [dateKey]: {
            ...currentEntry,
            isEditing: true,
            practicalNumbers: Array.isArray(currentEntry.practicalNumbers) 
               ? currentEntry.practicalNumbers.join(", ") 
               : currentEntry.practicalNumbers || "",
          },
        }));
      }
    },
    [diaryData, setDiaryData]
  );

  // The full page loader has been removed here. DiaryWeekView handles it gracefully with Skeleton loaders.

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
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 ">
        
        {/* Beautiful Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 rounded-t-[22px] p-5 sm:p-6 text-white shadow-none">
          <div className="absolute top-[-80px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[160px] h-[160px] rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center flex-shrink-0">
                 <InteractiveAvatar
                    src={profile?.profileImage}
                    fallbackText={profile?.userName?.charAt(0) || profile?.name?.charAt(0) || "T"}
                    userId={profile?.userId}
                    editable={false}
                    className="w-12 h-12 shadow-sm border-2 border-white/30"
                 />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Instructor Portal</div>
                <h1 className="text-xl sm:text-2xl font-extrabold leading-tight shadow-sm">Daily Diary Management</h1>
                <div className="text-xs text-white/80 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{profile?.userName || profile?.name || "Teacher"}</span>
                  {profile?.email && (
                    <>
                      <span className="opacity-50">·</span>
                      <span>{profile.email}</span>
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
            
            <div className="flex flex-row p-1 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 self-start lg:self-auto w-full sm:w-auto">
              <button onClick={() => setActiveTab("monthly")} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-white hover:bg-white/20'}`}>Monthly</button>
              <button onClick={() => setActiveTab("weekly")} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'weekly' ? 'bg-white text-blue-700 shadow-sm' : 'text-white hover:bg-white/20'}`}>Weekly</button>
              <button onClick={() => setActiveTab("daily")} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'daily' ? 'bg-white text-blue-700 shadow-sm' : 'text-white hover:bg-white/20'}`}>Daily</button>
            </div>
          </div>
        </div>

        {/* Content Render */}
        <div className="animate-in fade-in duration-500">
          {activeTab === "monthly" ? (
            <div className="w-full space-y-4">
              <InstructorDailyDiary />
            </div>
          ) : (
            <div className="w-full space-y-4">
              {/* Responsive Navigation attached to header */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 sm:p-3 rounded-b-[22px] shadow-lg border border-gray-200 dark:border-gray-800 border-t-0 mb-4 sticky top-4 z-20">
                <Button variant="ghost" size="sm" onClick={handlePreviousWeek} disabled={!canGoPreviousPeriod} className="flex-1 sm:flex-none justify-start px-2 sm:px-4 active:scale-95 transition-transform hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronLeft className="h-5 w-5 sm:mr-1" /> <span className="hidden sm:inline font-bold">Previous</span>
                </Button>
                <div className="px-2 sm:px-6 text-center font-extrabold text-sm sm:text-base text-gray-800 dark:text-gray-100 whitespace-nowrap">
                  {activeTab === "daily" ? dailyDateLabel : `Week ${weekNumber}`}
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
