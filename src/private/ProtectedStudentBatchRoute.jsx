/**
 * ProtectedStudentBatchRoute
 *
 * Blocks unenrolled students from accessing batch-required routes.
 * A student is considered "enrolled" if they appear in the batchStudents
 * collection (i.e., they have an approved request) — NOT by profile.batchId alone.
 *
 * Teachers and admins are always allowed through immediately without waiting for batch checks.
 */
import React from "react";
import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";
import { selectUser, selectUserLoading } from "@/store/userSlice";
import { selectProfile, selectProfileLoading } from "@/store/profileSlice";
import AppSplashScreen from "@/components/common/AppSplashScreen";

const ProtectedStudentBatchRoute = () => {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const userLoading = useSelector(selectUserLoading);
  const profileLoading = useSelector(selectProfileLoading);

  const isTeacher =
    user?.labels?.includes("Teacher") || profile?.role?.includes?.("Teacher");
  const isAdmin = user?.labels?.includes("admin");

  // 1. Teachers and admins bypass student batch enrollment verification immediately
  if (isTeacher || isAdmin) {
    return <Outlet />;
  }

  const isStudent = user && !isTeacher && !isAdmin;
  const { userBatches, isLoading: batchLoading } = useSelector(
    (state) => state.activeBatch
  );

  // 2. Still loading auth/profile or global batch state for student
  if (userLoading || profileLoading || batchLoading) {
    return <AppSplashScreen message="Verifying Batch Enrollment..." />;
  }

  const isEnrolled = !isStudent || userBatches?.length > 0;

  // 3. Unenrolled student — redirect to browse batches
  if (isStudent && !isEnrolled) {
    return <Navigate to="/browse-batches" replace />;
  }

  return <Outlet />;
};

export default ProtectedStudentBatchRoute;
