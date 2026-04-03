import { selectProfile, selectProfileLoading } from "@/store/profileSlice";
import { selectUser, selectUserLoading } from "@/store/userSlice";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const user = useSelector(selectUser);
  const userLoading = useSelector(selectUserLoading);
  const profile = useSelector(selectProfile);
  const profileLoading = useSelector(selectProfileLoading);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userLoading || profileLoading || !user) return;

    const isTeacher = user?.labels?.includes("Teacher");
    const isAdmin = user?.labels?.includes("admin");

    // ── Phase 1: Onboarding gate ──────────────────────────────────────────────
    // A user needs onboarding if they have no profile or profile is incomplete.
    // isProfileComplete is the primary source of truth.
    const isOnboarded = !!profile?.isProfileComplete;
    const needsOnboarding = !profile || !isOnboarded;

    const whitelistedPaths = ["/onboarding", "/onboarding/teacher", "/profile"];
    const isWhitelisted = whitelistedPaths.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + "/")
    );

    if (needsOnboarding && !isWhitelisted) {
      if (isTeacher) {
        navigate("/onboarding/teacher");
      } else if (!isAdmin) {
        navigate("/onboarding");
      }
    }
  }, [user, profile, navigate, userLoading, profileLoading, location.pathname]);

  // Redirect to login if unauthenticated
  if (!userLoading && !profileLoading && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Show nothing while determining auth/profile state
  if (userLoading || profileLoading) {
    return null;
  }

  return <Outlet />;
};

export default ProtectedRoute;
