import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { selectUser } from "@/store/userSlice";
import { addProfile, selectProfile } from "@/store/profileSlice";
import userProfileService from "@/appwrite/userProfileService";

import TeacherStepBasicInfo from "./TeacherStepBasicInfo";
import TeacherStepProfessional from "./TeacherStepProfessional";
import TeacherStepScope from "./TeacherStepScope";
import TeacherStepComplete from "./TeacherStepComplete";

export default function TeacherOnboardingWizard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const existingProfile = useSelector(selectProfile);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        ...existingProfile,
        userName: existingProfile.userName || user?.name || "",
        phone: existingProfile.phone || user?.phone || "",
        email: user?.email || "",
        collegeId: existingProfile.collegeId?.$id || existingProfile.collegeId || "",
        tradeId: existingProfile.tradeId?.$id || existingProfile.tradeId || "",
      });

      if (existingProfile.isProfileComplete || existingProfile.onboardingStep >= 4) {
        if (existingProfile.allBatchIds && existingProfile.allBatchIds.length === 0) {
          navigate("/manage-batch/create");
        } else {
          navigate("/dash");
        }
      } else if (existingProfile.onboardingStep > 0 && existingProfile.onboardingStep < 4) {
        setCurrentStep(existingProfile.onboardingStep);
      }
    } else if (user) {
      setFormData({
        userName: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [existingProfile, user, navigate]);

  const saveProfileProgress = async (stepData, incrementStep = true) => {
    if (!user) return false;
    
    setIsSaving(true);
    try {
      const mergedData = { ...formData, ...stepData };
      setFormData(mergedData);
      
      const newStep = incrementStep ? currentStep + 1 : currentStep;
      const isComplete = incrementStep && currentStep === 4;

      const payload = {
        ...mergedData,
        userId: user.$id,
        role: user.labels && user.labels.includes("Teacher") ? user.labels : [...(user.labels || []), "Teacher"],
        onboardingStep: newStep,
        isProfileComplete: isComplete,
      };

      if (isComplete) {
        payload.isApproved = true;
        payload.approvalStatus = "approved";
      }

      let updatedProfile;
      if (existingProfile) {
        updatedProfile = await userProfileService.updateUserProfile(existingProfile.$id, payload);
      } else {
        updatedProfile = await userProfileService.createUserProfile(payload);
      }

      dispatch(addProfile({ data: updatedProfile }));
      
      if (incrementStep) {
        setCurrentStep(newStep);
      }
      return true;
    } catch (error) {
       console.error("Error saving onboarding step:", error);
       toast.error("Failed to save progress. Please try again.");
       return false;
    } finally {
       setIsSaving(false);
    }
  };

  const handleNext = async (stepData) => {
    await saveProfileProgress(stepData, true);
  };

  const handleSkip = async () => {
    await saveProfileProgress({}, true);
  };

  const finishOnboarding = async () => {
    const ok = await saveProfileProgress({ isApproved: true, approvalStatus: "approved" }, true);
    if (ok) navigate("/manage-batch/create");
  };

  if (!user) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <TeacherStepBasicInfo initialData={formData} onNext={handleNext} isSaving={isSaving} />;
      case 2:
        return <TeacherStepProfessional initialData={formData} onNext={handleNext} isSaving={isSaving} />;
      case 3:
        return <TeacherStepScope initialData={formData} onNext={handleNext} onSkip={handleSkip} isSaving={isSaving} />;
      case 4:
      default:
        return <TeacherStepComplete onFinish={finishOnboarding} isSaving={isSaving} />;
    }
  };

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-6">
            Instructor Setup
          </h1>
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between relative mb-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>
            
            {[1, 2, 3, 4].map((step) => (
              <div 
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm z-10 transition-colors duration-300 ${
                  currentStep >= step 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-500 px-1">
             <span className="text-center w-8">Basic</span>
             <span className="text-center w-8">Trade</span>
             <span className="text-center w-8">Scope</span>
             <span className="text-center w-8">Done</span>
          </div>
        </div>

        <div className="animate-in fade-in zoom-in-95 duration-300 ease-out">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
