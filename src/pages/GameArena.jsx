import React from "react";
import { Loader2 } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import TeacherGameArena from "@/private/gamearena/TeacherGameArena";
import StudentGameArena from "@/private/gamearena/StudentGameArena";

/**
 * GameArena — Role-aware wrapper.
 * Delegates to TeacherGameArena or StudentGameArena based on user role.
 */
const GameArena = () => {
  const data = useDashboardData();

  // Global loading spinner while batch context resolves
  if (data.isBatchLoading && !data.activeBatchId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (data.isTeacher || data.isAdmin) {
    return (
      <TeacherGameArena
        profile={data.profile}
        batchContext={data.batchContext}
        batchOverview={data.batchOverview}
        studentRows={data.studentRows}
        attendanceTrend={data.attendanceTrend}
        selectedMonth={data.selectedMonth}
        setSelectedMonth={data.setSelectedMonth}
        userBatches={data.userBatches}
        isLoading={data.isLoading}
        error={data.error}
        refetch={data.refetch}
      />
    );
  }

  return (
    <StudentGameArena
      user={data.user}
      profile={data.profile}
      batchContext={data.batchContext}
      activeBatchId={data.activeBatchId}
      activeBatchData={data.activeBatchData}
      userBatches={data.userBatches}
      isBatchLoading={data.isBatchLoading}
    />
  );
};

export default GameArena;
