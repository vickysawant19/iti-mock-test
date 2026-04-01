import { selectProfile, selectProfileLoading } from "@/store/profileSlice";
import { selectUser, selectUserLoading } from "@/store/userSlice";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate, Outlet, useLocation } from "react-router-dom";
import studentBatchAccessService from "@/appwrite/studentBatchAccess";

const ProtectedRoute = () => {
  const user = useSelector(selectUser);
  const userLoading = useSelector(selectUserLoading);
  const profile = useSelector(selectProfile);
  const profileLoading = useSelector(selectProfileLoading);

  const [isBatchValidating, setIsBatchValidating] = useState(false);
  const [hasBatchAccess, setHasBatchAccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    if (!userLoading && !profileLoading && user) {
      const isTeacher = user?.labels?.includes("Teacher");
      const isAdmin = user?.labels?.includes("admin");
      const isStudent = !isTeacher && !isAdmin;

      // ── Phase 1: Onboarding gate ──────────────────────────────────────────
      const isOnboarded = profile?.isProfileComplete || (profile?.onboardingStep >= 4);
      const needsOnboarding = !profile || !isOnboarded;

      const whitelistedPaths = ["/onboarding", "/onboarding/teacher", "/profile", "/batch-enroll"];
      const isWhitelisted = whitelistedPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));

      if (needsOnboarding && !isWhitelisted) {
        console.log("[ProtectedRoute] User needs onboarding. Redirecting.");
        if (isTeacher) {
          navigate("/onboarding/teacher");
        } else {
          navigate("/onboarding");
        }
        return;
      }

      // ── Phase 2: Approval gate (students only) ────────────────────────────
      if (isStudent && isOnboarded && !isWhitelisted) {
        if (location.pathname.startsWith("/browse-batches")) {
          // Allow access to browse batches even if not approved
          setHasBatchAccess(true);
        } else {
          // Asynchronously validate batch constraints
          const validateBatch = async () => {
            setIsBatchValidating(true);
            try {
              const batchId = profile?.batchId?.$id || profile?.batchId;
              if (!batchId) {
                console.log("[ProtectedRoute] profile?.batchId is missing. Navigate to /batch-enroll");
                navigate("/batch-enroll");
                setHasBatchAccess(false);
                return;
              }

              console.log("[ProtectedRoute] Checking async status for batchId:", batchId);
              const status = await studentBatchAccessService.checkStudentBatchStatus(batchId, user.$id);
              console.log("[ProtectedRoute] Received batch status:", status);
              if (status === "ACTIVE") {
                setHasBatchAccess(true);
              } else {
                setHasBatchAccess(false);
                navigate("/batch-enroll", { state: { batchStatus: status } });
              }
            } catch (err) {
              console.error("Error validating batch access:", err);
              setHasBatchAccess(false);
            } finally {
              setIsBatchValidating(false);
            }
          };

          validateBatch();
          return; // Prevent fallthrough while validating
        }
      } else {
         // Teachers/Admins or Whitelisted automatically grant access
         setHasBatchAccess(true);
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

    return () => { isMounted = false; };
  }, [user, profile, navigate, userLoading, profileLoading, location.pathname]);

  // Only redirect to login if:
  // 1. Loading has finished (both user and profile)
  // 2. User is not authenticated
  if (!userLoading && !profileLoading && !user) {
    console.log("[ProtectedRoute] No user found, redirecting to roots.");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Show nothing while determining auth state or while verifying student batch
  if (userLoading || profileLoading || isBatchValidating) {
    console.log("[ProtectedRoute] Returning null... loaders active -> userLoading:", userLoading, "profileLoading:", profileLoading, "isBatchValidating:", isBatchValidating);
    return null; // A proper loader could be returned here
  }

  console.log("[ProtectedRoute] Rendering OUTLET? hasBatchAccess:", hasBatchAccess);
  // Allow rendering outlet only if access is verified
  return hasBatchAccess ? <Outlet /> : <div className="p-8 text-center text-red-500">Access Restricted / Routing Error</div>;
};

export default ProtectedRoute;
