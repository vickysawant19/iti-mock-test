import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectProfile, selectProfileLoading, selectProfileInitialized } from "@/store/profileSlice";
import { selectUser, selectUserLoading } from "@/store/userSlice";
import { checkProfileCompletion } from "@/utils/profileCompletion";
import AppSplashScreen from "@/components/common/AppSplashScreen";

const ProtectedRoute = () => {
  const user = useSelector(selectUser);
  const userLoading = useSelector(selectUserLoading);
  const profile = useSelector(selectProfile);
  const profileLoading = useSelector(selectProfileLoading);
  const isInitialized = useSelector(selectProfileInitialized);

  const location = useLocation();

  // ── Step 1: Wait for App's first auth check to finish ────────────────────────
  if (!isInitialized || userLoading || profileLoading) {
    return <AppSplashScreen />;
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
