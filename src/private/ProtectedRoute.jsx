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
    if (!userLoading && !profileLoading && user) {
      const isTeacher = user?.labels?.includes("Teacher");
      const isAdmin = user?.labels?.includes("admin");
      const isStudent = !isTeacher && !isAdmin;

      // ── Phase 1: Onboarding gate ──────────────────────────────────────────
      const isOnboarded = profile?.isProfileComplete || (profile?.onboardingStep >= 4);
      const needsOnboarding = !profile || !isOnboarded;

      const whitelistedPaths = ["/onboarding", "/onboarding/teacher", "/profile", "/approval-pending", "/approval-rejected"];
      const isWhitelisted = whitelistedPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));

      if (needsOnboarding && !isWhitelisted) {
        if (isTeacher) {
          navigate("/onboarding/teacher");
        } else {
          navigate("/onboarding");
        }
        return;
      }

      // ── Phase 2: Approval gate (students only) ────────────────────────────
      if (isStudent && isOnboarded && !isWhitelisted) {
        if (profile?.approvalStatus === "rejected") {
          navigate("/approval-rejected");
          return;
        }
        if (!profile?.isApproved && profile?.approvalStatus !== "approved") {
          navigate("/approval-pending");
          return;
        }
      }

      // ── Phase 3: Force Batch Creation (teachers only) ──────────────────────
      if (isTeacher && isOnboarded) {
        const hasNoBatches = !profile?.allBatchIds || profile.allBatchIds.length === 0;
        const teacherBatchWhitelistedPaths = [...whitelistedPaths, "/manage-batch/create"];
        const isTeacherBatchWhitelisted = teacherBatchWhitelistedPaths.some(
          (p) => location.pathname === p || location.pathname.startsWith(p + "/")
        );

        if (hasNoBatches && !isTeacherBatchWhitelisted) {
          navigate("/manage-batch/create");
          return;
        }
      }
    }
  }, [user, profile, navigate, userLoading, profileLoading, location.pathname]);

  // Only redirect to login if:
  // 1. Loading has finished (both user and profile)
  // 2. User is not authenticated
  if (!userLoading && !profileLoading && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Show nothing while determining auth state (either user or profile still loading)
  // Or render the outlet if the user is authenticated
  return userLoading || profileLoading ? null : <Outlet />;
};

export default ProtectedRoute;
