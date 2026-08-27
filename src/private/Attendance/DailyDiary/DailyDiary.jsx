import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import { selectActiveBatchId } from "@/store/activeBatchSlice";

import Loader from "@/components/components/Loader";
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";
import InstructorDailyDiary from "../teacher/DailyDiary/InstructorDailyDiary";
import StudentDailyDiary from "../student/DailyDiary/StudentDailyDiary";
import DiaryWeekView from "../teacher/DailyDiary/DiaryWeekView";
import MarkAttendanceModal from "../teacher/AttendanceRegister/components/DailyBatchAttendanceModal";

import { useDiaryData } from "./hooks/useDiaryData";
import { useDailyDiaryActions } from "./hooks/useDailyDiaryActions";
import DiaryPageHeader from "./components/DiaryPageHeader";
import DiaryPeriodNav from "./components/DiaryPeriodNav";

import { useDailyDiaryQueryParams } from "./hooks/useDailyDiaryQueryParams";

export default function DailyDiary() {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector(selectActiveBatchId);

  const { activeTab, setActiveTab } = useDailyDiaryQueryParams();

  const userLabels = user?.labels || profile?.labels || [];
  const isTeacher = userLabels.includes("Teacher") || profile?.role === "teacher" || profile?.role === "instructor";
  const isAdmin = userLabels.includes("admin") || profile?.role === "admin";
  const isStudent = !isTeacher && !isAdmin;

  if (isStudent) {
    return <StudentDailyDiary />;
  }

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
    fetchData,
    attendanceDocIds,
    setAttendance,
    setAttendanceDocIds,
  } = useDiaryData({
    viewType: activeTab === "daily" ? "daily" : "weekly",
    role: "teacher",
    enabled: activeTab !== "monthly",
  });

  const handleTeacherAttendanceUpdate = (dateStr, newStatus) => {
    setAttendance((prev) => new Map(prev).set(dateStr, newStatus));
  };

  const handleUpdateAttendanceDocId = (dateStr, docId) => {
    setAttendanceDocIds((prev) => new Map(prev).set(dateStr, docId));
  };

  const {
    isModalOpen,
    modalDate,
    modalMode,
    students,
    existingAttendance,
    actionLoadingDates,
    openAttendanceModal,
    closeAttendanceModal,
    handleSaveAttendance,
    handleAddHoliday,
    handleRemoveHoliday,
    handleClearDayAttendance,
    handleSetTeacherAttendance,
  } = useDailyDiaryActions({
    onRefreshData: fetchData,
    batchData,
    attendance,
    attendanceDocIds,
    onTeacherAttendanceUpdate: handleTeacherAttendanceUpdate,
    updateAttendanceDocId: handleUpdateAttendanceDocId,
  });

  const updateDiaryField = (dateKey, field, value) => {
    setDiaryData((prev) => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {
          theoryWork: "",
          practicalWork: "",
          practicalNumbers: [],
          extraWork: "",
          hours: "",
          remarks: "",
          isEditing: true,
        }),
        [field]: value,
      },
    }));
  };

  const toggleEditing = (dateKey) => {
    setDiaryData((prev) => {
      const current = prev[dateKey] || {
        theoryWork: "",
        practicalWork: "",
        practicalNumbers: [],
        extraWork: "",
        hours: "",
        remarks: "",
        isEditing: false,
      };
      return {
        ...prev,
        [dateKey]: {
          ...current,
          isEditing: !current.isEditing,
        },
      };
    });
  };



  if (!activeBatchId && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <NoBatchTeacherView isTeacher={true} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="w-full p-0 m-0">
        {/* Modular Header */}
        <DiaryPageHeader
          profile={profile}
          badgeText="Instructor Portal"
          title="Daily Diary Management"
          subtitle={profile?.email}
          extraId={profile?.email}
          batchName={batchData?.BatchName}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          gradient="from-blue-600 to-purple-600"
        />

        {/* Content Render */}
        <div className="animate-in fade-in duration-300">
          {activeTab === "monthly" ? (
            <div className="w-full space-y-4">
              <InstructorDailyDiary />
            </div>
          ) : (
            <div className="w-full space-y-4">
              <MarkAttendanceModal
                isOpen={isModalOpen}
                onClose={closeAttendanceModal}
                students={students}
                date={modalDate}
                batchId={activeBatchId}
                onSave={handleSaveAttendance}
                existingAttendance={existingAttendance}
                holidays={holidays}
                handleAddHoliday={handleAddHoliday}
                handleRemoveHoliday={(d) => handleRemoveHoliday(d, holidays)}
                handleClearDayAttendance={handleClearDayAttendance}
                initialMode={modalMode}
              />

              {/* Floating Period Navigation */}
              <DiaryPeriodNav
                onPrevious={handlePreviousWeek}
                onNext={handleNextWeek}
                canPrevious={canGoPreviousPeriod}
                label={activeTab === "daily" ? dailyDateLabel : `Week ${weekNumber}`}
              />

              <DiaryWeekView
                weekDays={weekDays}
                diaryData={diaryData}
                attendance={attendance}
                holidays={holidays}
                isLoading={isLoading}
                actionLoadingDates={actionLoadingDates}
                isTeacher={true}
                updateDiaryField={updateDiaryField}
                toggleEditing={toggleEditing}
                onOpenAttendanceModal={openAttendanceModal}
                onSetTeacherAttendance={handleSetTeacherAttendance}
                onRemoveHoliday={(dateKey) => handleRemoveHoliday(dateKey, holidays)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
