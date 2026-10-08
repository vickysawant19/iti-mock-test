import React, { useEffect, useRef, useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

import { addUser, selectUser } from "./store/userSlice";
import {
  addProfile,
  selectProfile,
  selectProfileInitialized,
} from "./store/profileSlice";
import { initializeActiveBatch } from "./store/activeBatchSlice";
import { store } from "./store/store";
import authService from "@/services/auth/auth.service";
import userProfileService from "@/services/auth/userProfileService";
import Navbar from "./components/navbar/Navbar";
import { Analytics } from "@vercel/analytics/react";
import { usePresence } from "./hooks/usePresence";

import { ThemeProvider } from "./ThemeProvider";

import PageFallbackLoader from "./components/common/PageFallbackLoader";
import NotificationModalManager from "./components/notifications/NotificationModalManager";
import { checkProfileCompletion } from "./utils/profileCompletion";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSetupPromptDismissed, setIsSetupPromptDismissed] = useState(
    () => sessionStorage.getItem("dismissed_setup_prompt") === "true"
  );
  const batchInitUserRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const profileInitialized = useSelector(selectProfileInitialized);
  const activeBatchState = useSelector((state) => state.activeBatch);
  const userBatches = activeBatchState.userBatches || [];

  // Track the current user's live presence (online / away / heartbeat / cleanup on logout)
  usePresence();

  const isQuotaExceededPage = location.pathname === "/quota-exceeded";

  const checkUserStatus = async () => {
    dispatch(addUser({ isLoading: true }));
    dispatch(addProfile({ isLoading: true }));
    try {
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        // Detect login user change to prevent data swapping
        const lastUserId = localStorage.getItem("last_active_user");
        if (lastUserId && lastUserId !== currentUser.$id) {
          console.warn("[App.jsx] Logged-in user changed. Cleaning localStorage user caches...");
          const theme = localStorage.getItem("app-theme");
          localStorage.clear();
          if (theme) {
            localStorage.setItem("app-theme", theme);
          }
        }
        localStorage.setItem("last_active_user", currentUser.$id);

        dispatch(addUser({ data: currentUser, isLoading: false }));

        // Read profile from live Redux state to avoid stale closure bug
        const freshProfile = store.getState().profile.data;

        if (!freshProfile) {
          const profileRes = await userProfileService.getUserProfile(
            currentUser.$id
          );
          if (profileRes) {
            dispatch(addProfile({ data: profileRes, isLoading: false }));
          } else {
            // No profile in DB — send to onboarding
            dispatch(addProfile({ isLoading: false }));
            if (currentUser.labels && currentUser.labels.includes("Teacher")) {
              navigate("/onboarding/teacher");
            } else {
              navigate("/onboarding");
            }
          }
        } else {
          // Profile already in Redux — just sync batch, no extra DB call
          dispatch(addUser({ isLoading: false }));
          dispatch(addProfile({ isLoading: false }));
        }
      } else {
        console.log("[App.jsx] No logged-in user session found.");
        localStorage.removeItem("last_active_user");
        dispatch(addUser({ isLoading: false }));
        dispatch(addProfile({ isLoading: false }));
      }
    } catch (error) {
      console.error("Error checking user status: ", error);
      dispatch(addUser({ isLoading: false }));
      dispatch(addProfile({ isLoading: false }));
      if (error?.code === 402 || error?.type === "limit_databases_reads_exceeded") {
        navigate("/quota-exceeded");
      }
    } finally {
      setIsLoading(false);
      // Signal that App's first auth check is complete — ProtectedRoute may now evaluate redirects
      dispatch(addProfile({ isInitialized: true }));
    }
  };

  useEffect(() => {
    checkUserStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, dispatch]);

  useEffect(() => {
    if (!user?.$id) {
      batchInitUserRef.current = null;
      return;
    }
    if (!profileInitialized || !profile || batchInitUserRef.current === user.$id) return;

    batchInitUserRef.current = user.$id;
    dispatch(initializeActiveBatch(profile));
  }, [dispatch, profile, profileInitialized, user?.$id]);

  useEffect(() => {
    if (isLoading || !profileInitialized || !user) return;
    if (location.pathname !== "/") return;

    const isTeacher = user.labels?.includes("Teacher") || profile?.role?.includes?.("Teacher");
    const isAdmin = user.labels?.includes("admin");
    const isProfileComplete = profile?.isProfileComplete ?? checkProfileCompletion(profile).isComplete;

    if (!isAdmin && !isProfileComplete) {
      navigate(isTeacher ? "/onboarding/teacher" : "/onboarding", { replace: true });
      return;
    }

    if (activeBatchState.isLoading || activeBatchState.error) return;

    if (isTeacher && userBatches.length === 0) {
      navigate("/batches/create", { replace: true });
    } else if (!isTeacher && !isAdmin && userBatches.length === 0) {
      navigate("/browse-batches", { replace: true });
    } else if (location.pathname === "/") {
      navigate("/arena", { replace: true });
    }
  }, [
    activeBatchState.isLoading,
    activeBatchState.error,
    isLoading,
    location.pathname,
    navigate,
    profile,
    profileInitialized,
    user,
    userBatches.length,
  ]);

  const isTeacher = user?.labels?.includes("Teacher") || profile?.role?.includes?.("Teacher");
  const isAdmin = user?.labels?.includes("admin");
  const isProfileComplete = profile?.isProfileComplete ?? checkProfileCompletion(profile).isComplete;
  const isOnboardingPage = location.pathname.startsWith("/onboarding");

  // Track session and local completion status
  const hasManagedEnrollment = Boolean(
    location.pathname.includes("/students") ||
    localStorage.getItem("teacher_managed_enrollment") === "true"
  );
  const hasFoundBatch = Boolean(
    location.pathname === "/browse-batches" ||
    localStorage.getItem("student_found_batch") === "true"
  );

  const studentRequests = activeBatchState.studentRequests || [];
  const hasSubmittedRequest = studentRequests.length > 0 || userBatches.length > 0;
  const hasPendingBatchRequest = studentRequests.some(
    (request) => request.status?.toLowerCase() === "pending"
  );

  const teacherBatchesExist = userBatches.length > 0;
  const teacherHasEnrolledStudents = Boolean(
    teacherBatchesExist && (
      userBatches.some((b) => (b.memberCount || 0) > 1 || (b.totalStudents || 0) > 0) ||
      hasManagedEnrollment
    )
  );

  // Exact first-session checklists:
  // Teachers: Complete profile → Create batch → Manage enrollment
  // Students: Complete profile → Find a batch → Request to join
  const teacherSteps = [
    {
      id: "profile",
      label: "Complete profile",
      complete: Boolean(isProfileComplete),
      path: "/onboarding/teacher",
      actionLabel: "Complete profile",
      description: "Finish your instructor profile details to unlock batch management.",
    },
    {
      id: "create-batch",
      label: "Create batch",
      complete: teacherBatchesExist,
      path: "/batches/create",
      actionLabel: "Create batch",
      description: "Set up your batch schedule, attendance window, and campus location.",
    },
    {
      id: "enrollment",
      label: "Manage enrollment",
      complete: teacherHasEnrolledStudents,
      path: userBatches[0]?.$id ? `/batches/${userBatches[0].$id}/students` : "/batches/students",
      actionLabel: "Manage enrollment",
      description: "Add students directly or review enrollment join requests.",
    },
  ];

  const studentSteps = [
    {
      id: "profile",
      label: "Complete profile",
      complete: Boolean(isProfileComplete),
      path: "/onboarding",
      actionLabel: "Complete profile",
      description: "Finish your personal and trade details to begin discovering batches.",
    },
    {
      id: "find-batch",
      label: "Find a batch",
      complete: Boolean(userBatches.length > 0 || hasSubmittedRequest || hasFoundBatch),
      path: "/browse-batches",
      actionLabel: "Find a batch",
      description: "Browse available batches by institution and trade.",
    },
    {
      id: "request-join",
      label: "Request to join",
      complete: Boolean(userBatches.length > 0 || (hasSubmittedRequest && !hasPendingBatchRequest)),
      pending: Boolean(hasPendingBatchRequest && userBatches.length === 0),
      path: "/browse-batches",
      actionLabel: hasPendingBatchRequest ? "Track request" : "Request to join",
      description: hasPendingBatchRequest
        ? "Request submitted! Awaiting instructor review and approval."
        : "Select an active batch and submit a request to your instructor.",
    },
  ];

  const setupSteps = isTeacher ? teacherSteps : studentSteps;
  const completedStepsCount = setupSteps.filter((step) => step.complete).length;
  const isAllComplete = completedStepsCount === setupSteps.length;
  const currentStep = setupSteps.find((step) => !step.complete) || setupSteps[setupSteps.length - 1];

  // Instant check from localStorage to prevent split-second flash on page reload
  const isLocallySetupComplete = Boolean(
    user?.$id && (
      localStorage.getItem(`setup_completed_${user.$id}`) === "true" ||
      localStorage.getItem(`student_joined_batch_${user.$id}`) === "true" ||
      Boolean(localStorage.getItem(`activeBatch_${user.$id}`))
    )
  );

  // If complete, persist so subsequent reloads never flash
  useEffect(() => {
    if (user?.$id && (isAllComplete || userBatches.length > 0)) {
      localStorage.setItem(`setup_completed_${user.$id}`, "true");
    }
  }, [user?.$id, isAllComplete, userBatches.length]);

  const showSetupPrompt = Boolean(
    !isLoading &&
    activeBatchState.isInitialized &&
    !activeBatchState.isLoading &&
    user &&
    !isAdmin &&
    !isOnboardingPage &&
    !isLocallySetupComplete &&
    !isAllComplete &&
    !isSetupPromptDismissed
  );

  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <div className="bg-gray-100 w-full min-h-screen dark:bg-black">
        <NotificationModalManager />
        {!isQuotaExceededPage && (
          <Navbar
            isNavOpen={isNavOpen}
            setIsNavOpen={setIsNavOpen}
            isLoading={isLoading}
          />
        )}

        {showSetupPrompt && (
          <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-5 lg:px-8" role="status">
            <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50/95 px-4 py-3.5 shadow-xs backdrop-blur-xs dark:border-indigo-900/70 dark:bg-indigo-950/40 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-indigo-600/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
                    {isTeacher ? "Instructor Checklist" : "Student Checklist"}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {hasPendingBatchRequest && !isTeacher
                      ? `(${completedStepsCount} of ${setupSteps.length} complete • Awaiting approval)`
                      : `(${completedStepsCount} of ${setupSteps.length} complete)`}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {currentStep.label}: <span className="font-normal text-slate-600 dark:text-slate-300">{currentStep.description}</span>
                </p>

                {/* Connected Stepper */}
                <ol className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2" aria-label="First-session checklist">
                  {setupSteps.map((step, index) => {
                    const isCurrent = currentStep.id === step.id;
                    return (
                      <React.Fragment key={step.id}>
                        {index > 0 && (
                          <ChevronRight
                            className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-600"
                            aria-hidden="true"
                          />
                        )}
                        <li>
                          <Link
                            to={step.path}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                              step.pending
                                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                                : step.complete
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                                : isCurrent
                                ? "border-indigo-400 bg-indigo-600 text-white shadow-xs dark:border-indigo-500 dark:bg-indigo-600"
                                : "border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                step.pending
                                  ? "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
                                  : step.complete
                                  ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200"
                                  : isCurrent
                                  ? "bg-white text-indigo-700"
                                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {step.pending ? "⏳" : step.complete ? "✓" : index + 1}
                            </span>
                            <span className={step.complete ? "line-through opacity-85" : ""}>
                              {step.label}
                              {step.pending && <span className="ml-1 text-[10px] font-normal opacity-90">(Pending)</span>}
                            </span>
                          </Link>
                        </li>
                      </React.Fragment>
                    );
                  })}
                </ol>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-start lg:self-center">
                <Link
                  to={currentStep.path}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  {currentStep.actionLabel}
                </Link>
                <button
                  type="button"
                  aria-label="Dismiss checklist for this session"
                  title="Dismiss for this session"
                  onClick={() => {
                    sessionStorage.setItem("dismissed_setup_prompt", "true");
                    setIsSetupPromptDismissed(true);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-indigo-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto">
          <React.Suspense fallback={<PageFallbackLoader />}>
            <Outlet />
          </React.Suspense>
          <ToastContainer />
        </div>

        {import.meta.env.PROD && <Analytics />}
      </div>
    </ThemeProvider>
  );
}

export default App;
