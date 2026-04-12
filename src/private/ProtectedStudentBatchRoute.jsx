/**
 * ProtectedStudentBatchRoute
 *
 * Blocks unenrolled students from accessing batch-required routes.
 * A student is considered "enrolled" if they appear in the batchStudents
 * collection (i.e., they have an approved request) — NOT by profile.batchId alone.
 *
 * Teachers and admins are always allowed through.
 * If still loading, shows nothing (same pattern as ProtectedRoute).
 */
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";
import { selectUser, selectUserLoading } from "@/store/userSlice";
import { selectProfileLoading } from "@/store/profileSlice";
import batchStudentService from "@/appwrite/batchStudentService";
const ProtectedStudentBatchRoute = () => {
  const user = useSelector(selectUser);
  const userLoading = useSelector(selectUserLoading);
  const profileLoading = useSelector(selectProfileLoading);

  const isTeacher = user?.labels?.includes("Teacher");
  const isAdmin = user?.labels?.includes("admin");
  const isStudent = user && !isTeacher && !isAdmin;

  const { userBatches, isLoading: batchLoading } = useSelector((state) => state.activeBatch);
  
  // Teachers and Admins don't need batch to pass this route (always allowed)
  // For students, check if userBatches array has items
  
  // Still loading auth/profile or global batch state
  if (userLoading || profileLoading || batchLoading) return null;
  
  const isEnrolled = !isStudent || userBatches?.length > 0;

  // Unenrolled student — redirect to browse batches
  if (isStudent && !isEnrolled) {
    return <Navigate to="/browse-batches" replace />;
  }

  return <Outlet />;
};

export default ProtectedStudentBatchRoute;
