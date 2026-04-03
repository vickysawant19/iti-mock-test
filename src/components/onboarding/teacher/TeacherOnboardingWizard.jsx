import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { selectUser } from "@/store/userSlice";
import { addProfile, selectProfile } from "@/store/profileSlice";
import userProfileService from "@/appwrite/userProfileService";
import { checkProfileCompletion } from "@/utils/profileCompletion";

import TeacherStepBasicInfo from "./TeacherStepBasicInfo";
import StepPersonalInfo from "../StepPersonalInfo";
import StepAcademic from "../StepAcademic";
import TeacherStepComplete from "./TeacherStepComplete";

const STEPS = [
  { label: "Basic" },
  { label: "Personal" },
  { label: "Academic" },
  { label: "Review" },
];

export default function TeacherOnboardingWizard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const existingProfile = useSelector(selectProfile);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Guard: only restore step on initial mount, not on every profile change
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    console.log("[WIZARD useEffect] fired — hasInitializedRef:", hasInitializedRef.current, "| existingProfile:", existingProfile ? `onboardingStep=${existingProfile.onboardingStep}, isProfileComplete=${existingProfile.isProfileComplete}` : "null");

    if (existingProfile) {
      if (!hasInitializedRef.current) {
        console.log("[WIZARD useEffect] FIRST MOUNT — hydrating formData and checking step resume");
        setFormData({
          ...existingProfile,
          userName: existingProfile.userName || user?.name || "",
          phone: existingProfile.phone || user?.phone || "",
          email: user?.email || "",
          DOB: existingProfile.DOB ? existingProfile.DOB.split("T")[0] : "",
          address: existingProfile.address || "",
          collegeId: existingProfile.collegeId?.$id || existingProfile.collegeId || "",
          tradeId: existingProfile.tradeId?.$id || existingProfile.tradeId || "",
        });
      }

      // Already complete → go to dash
      if (existingProfile.isProfileComplete) {
        console.log("[WIZARD useEffect] isProfileComplete=true → navigating to /dash");
        navigate("/dash");
        return;
      }

      // Only restore saved step on FIRST mount (resume mid-progress)
      if (!hasInitializedRef.current) {
        if (existingProfile.onboardingStep > 0 && existingProfile.onboardingStep <= 4) {
          console.log("[WIZARD useEffect] Restoring step to:", existingProfile.onboardingStep);
          setCurrentStep(Math.min(existingProfile.onboardingStep, 4));
        }
        hasInitializedRef.current = true;
      }
    } else if (user && !hasInitializedRef.current) {
      setFormData({
        userName: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
      hasInitializedRef.current = true;
    }
  }, [existingProfile, user, navigate]);

  const saveProgress = async (stepData, nextStep) => {
    console.log(`[WIZARD saveProgress] called — currentStep: ${currentStep}, nextStep: ${nextStep}`);
    if (!user) return false;
    setIsSaving(true);

    try {
      const merged = { ...formData, ...stepData };
      setFormData(merged);

      const { isComplete } = checkProfileCompletion(merged);
      console.log("[WIZARD saveProgress] checkProfileCompletion result:", isComplete);

      const roleLabels =
        user.labels && user.labels.includes("Teacher")
          ? user.labels
          : [...(user.labels || []), "Teacher"];

      const payload = {
        ...merged,
        userId: user.$id,
        role: roleLabels,
        onboardingStep: nextStep,
        isProfileComplete: isComplete,
        enrollmentStatus: merged.enrollmentStatus || "enrolled",
        status: merged.status || "active",
      };

      let updated;
      if (existingProfile) {
        updated = await userProfileService.updateUserProfile(existingProfile.$id, payload);
      } else {
        updated = await userProfileService.createUserProfile(payload);
      }

      dispatch(addProfile({ data: updated }));
      setCurrentStep(nextStep);
      return true;
    } catch (err) {
      console.error("Teacher onboarding save error:", err);
      toast.error("Failed to save progress. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = (stepData) => saveProgress(stepData, currentStep + 1);
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    const ok = await saveProgress({}, currentStep + 1);
    // Redirect to dashboard
    if (ok) navigate("/dash");
  };

  if (!user) return null;

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-6">
            Instructor Setup
          </h1>

          {/* Stepper */}
          <div className="flex items-center justify-between relative mb-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
            {STEPS.map((step, i) => {
              const stepNum = i + 1;
              const done = currentStep > stepNum;
              const active = currentStep === stepNum;
              return (
                <div
                  key={stepNum}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm z-10 transition-all duration-300 border-2 ${
                    done
                      ? "bg-blue-600 border-blue-600 text-white"
                      : active
                      ? "bg-white dark:bg-slate-900 border-blue-600 text-blue-600"
                      : "bg-slate-200 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {done ? "✓" : stepNum}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-500 mt-1">
            {STEPS.map((s) => (
              <span key={s.label} className="w-9 text-center">
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="animate-in fade-in zoom-in-95 duration-300 ease-out">
          {currentStep === 1 && (
            <TeacherStepBasicInfo initialData={formData} onNext={handleNext} isSaving={isSaving} />
          )}
          {currentStep === 2 && (
            <StepPersonalInfo
              initialData={formData}
              onNext={handleNext}
              onBack={handleBack}
              isSaving={isSaving}
            />
          )}
          {currentStep === 3 && (
            <StepAcademic
              initialData={formData}
              onNext={handleNext}
              onBack={handleBack}
              isSaving={isSaving}
              role="Teacher"
            />
          )}
          {currentStep === 4 && (
            <TeacherStepComplete
              formData={formData}
              onFinish={handleFinish}
              onBack={handleBack}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
