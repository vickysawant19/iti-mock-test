/**
 * ProtectedStudentBatchRoute
 *
 * Blocks unenrolled students from accessing batch-required routes.
 * A student is considered "enrolled" if they appear in the batchStudents
 * collection (i.e., they have an approved request) — NOT by profile.batchId alone.
 *
 * Teachers and admins are always allowed through.
 * If still loading, shows a clean full-screen loading state instead of blank flash.
 */
import React from "react";
import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";
import { selectUser, selectUserLoading } from "@/store/userSlice";
import { selectProfileLoading } from "@/store/profileSlice";

// Full-screen auth loading spinner — prevents jarring blank flash
const AuthLoadingScreen = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 z-50">
    <div className="relative flex items-center justify-center mb-4">
      <div className="w-12 h-12 rounded-full border-4 border-blue-100 dark:border-slate-800" />
      <div className="absolute w-12 h-12 rounded-full border-4 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
    </div>
    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-pulse">
      Verifying Batch Enrollment...
    </p>
  </div>
);

const ProtectedStudentBatchRoute = () => {
  const user = useSelector(selectUser);
  const userLoading = useSelector(selectUserLoading);
  const profileLoading = useSelector(selectProfileLoading);

  const isTeacher = user?.labels?.includes("Teacher");
  const isAdmin = user?.labels?.includes("admin");
  const isStudent = user && !isTeacher && !isAdmin;

  const { userBatches, isLoading: batchLoading } = useSelector((state) => state.activeBatch);
  
  // Still loading auth/profile or global batch state
  if (userLoading || profileLoading || batchLoading) {
    return <AuthLoadingScreen />;
  }
  
  const isEnrolled = !isStudent || userBatches?.length > 0;

  // Unenrolled student — redirect to browse batches
  if (isStudent && !isEnrolled) {
    return <Navigate to="/browse-batches" replace />;
  }

  return <Outlet />;
};

export default ProtectedStudentBatchRoute;
