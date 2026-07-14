import { selectProfile, selectProfileLoading, selectProfileInitialized } from "@/store/profileSlice";
import { selectUser, selectUserLoading } from "@/store/userSlice";
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { checkProfileCompletion } from "@/utils/profileCompletion";

// Full-screen auth loading spinner — prevents jarring blank flash
const AuthLoadingScreen = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 z-50">
    <div className="relative flex items-center justify-center mb-4">
      <div className="w-12 h-12 rounded-full border-4 border-blue-100 dark:border-slate-800" />
      <div className="absolute w-12 h-12 rounded-full border-4 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
    </div>
    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-pulse">
      Loading...
    </p>
  </div>
);

const ProtectedRoute = () => {
  const user = useSelector(selectUser);
  const userLoading = useSelector(selectUserLoading);
  const profile = useSelector(selectProfile);
  const profileLoading = useSelector(selectProfileLoading);
  const isInitialized = useSelector(selectProfileInitialized);

  const location = useLocation();



  // ── Step 1: Wait for App's first auth check to finish ────────────────────────
  if (!isInitialized || userLoading || profileLoading) {
    return <AuthLoadingScreen />;
  }

  // ── Step 2: Not authenticated ────────────────────────────────────────────────
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ── Step 3: Onboarding gate ──────────────────────────────────────────────────
  const isTeacher = user?.labels?.includes("Teacher");
  const isAdmin = user?.labels?.includes("admin");

  const isOnboarded = profile
    ? (profile.isProfileComplete ?? checkProfileCompletion(profile).isComplete)
    : false;
  const needsOnboarding = !profile || !isOnboarded;

  const whitelistedPaths = ["/onboarding", "/onboarding/teacher", "/profile"];
  const isWhitelisted = whitelistedPaths.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
  );

  if (needsOnboarding && !isWhitelisted && !isAdmin) {
    const dest = isTeacher ? "/onboarding/teacher" : "/onboarding";
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
