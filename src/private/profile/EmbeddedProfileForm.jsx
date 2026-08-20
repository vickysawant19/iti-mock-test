import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { FormProvider, useForm } from "react-hook-form";
import { Query } from "appwrite";
import { Save } from "lucide-react";

import userProfileService from "@/appwrite/userProfileService";
import { selectUser } from "@/store/userSlice";
import { addProfile, selectProfile } from "@/store/profileSlice";

import AcademicAndBatchSection from "./AcademicAndBatchSection";
import PersonalDetailsSection from "./PersonalDetailsSection";
import Loader from "@/components/components/Loader";

const EmbeddedProfileForm = ({ explicitUserId, onSuccess, onCancel, defaultBatchId, initialData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [othersProfile, setOthersProfile] = useState(null);
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState("create"); // "create" or "edit"

  const dispatch = useDispatch();
  const methods = useForm({
    defaultValues: {
      isActive: true,
    }
  });

  const user = useSelector(selectUser);
  const existingProfile = useSelector(selectProfile);
  
  const targetUserId = explicitUserId || user?.$id;
  const isUserProfile = !!explicitUserId && explicitUserId !== user?.$id;

  // Determine role of the profile we are editing
  const profileToEdit = isUserProfile ? othersProfile : existingProfile;
  const targetRole = profileToEdit?.role || [];
  
  const isTargetTeacher = targetRole.includes("Teacher");
  const isTargetStudent = targetRole.includes("Student") || (!isTargetTeacher && targetUserId);

  const isTeacher = user.labels.includes("Teacher");
  const isStudent = !isTeacher;

  // Helper to format phone for numeric input field
  const cleanPhone = (val) => {
    if (!val) return "";
    const str = String(val).replace(/^\+91/, "").replace(/\D/g, "");
    return str.length > 10 ? str.slice(-10) : str;
  };

  // Define which fields students can edit
  const studentEditableFields = [
    "DOB",
    "email",
    "phone",
    "parentContact",
    "address",
    "profileImage",
  ];

  const isFieldEditable = (fieldName) => {
    if (formMode === "create") return true; 
    if (isTeacher) return true; 
    return studentEditableFields.includes(fieldName);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        let profileData = null;

        if (isUserProfile) {
          // Editing another user's profile
          const userProfile = await userProfileService.getUserProfile(targetUserId);
          setOthersProfile(userProfile);
          profileData = userProfile;
          setFormMode(userProfile ? "edit" : "create");
        } else if (existingProfile) {
          // Editing current user's profile
          profileData = existingProfile;
          setFormMode("edit");
        } else {
          // Creating new profile
          setFormMode("create");
        }

        if (profileData) {
          // Format dates and prefill missing fields from initialData if available
          const formattedData = {
            ...profileData,
            DOB: profileData.DOB ? profileData.DOB.split("T")[0] : "",
            enrolledAt: profileData.enrolledAt
              ? profileData.enrolledAt.split("T")[0]
              : "",
            userName: profileData.userName || initialData?.userName || initialData?.name || "",
            email: profileData.email || initialData?.email || "",
            phone: cleanPhone(profileData.phone || initialData?.phone),
          };
          methods.reset(formattedData);
        } else if (isUserProfile) {
          // Creating/completing a profile for another user (or profile document doesn't exist yet)
          methods.reset({
            userId: targetUserId,
            userName: initialData?.userName || initialData?.name || "",
            email: initialData?.email || "",
            phone: cleanPhone(initialData?.phone),
            isActive: true,
            ...initialData,
          });
        } else {
          // Creating new profile for logged-in user
          methods.reset({
            userId: user?.$id,
            userName: user?.name || initialData?.userName || "",
            email: user?.email || initialData?.email || "",
            phone: cleanPhone(user?.phone || initialData?.phone),
            isActive: true,
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load profile data. It may not exist yet.");
      } finally {
        setIsLoading(false);
      }
    };

    if (targetUserId) {
        fetchInitialData();
    } else {
        setIsLoading(false);
    }
  }, [methods.reset, targetUserId, existingProfile, isUserProfile, user?.$id, defaultBatchId, initialData]);

  const handleProfileSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      let updatedProfile;

      if (isUserProfile && othersProfile) {
        // Updating another user's existing profile
        if (isTeacher) {
          data.isProfileComplete = true;
          data.onboardingStep = 4;
        }
        updatedProfile = await userProfileService.updateUserProfile(
          othersProfile.$id,
          data
        );
        toast.success("Student profile updated successfully!");
        if (onSuccess) onSuccess(updatedProfile);
        
      } else if (isUserProfile && !othersProfile) {
        // Teacher creating a profile for a student explicitly
        data.role = ["Student"];
        data.userId = targetUserId;
        // Teachers completing profile effectively auto-approve the structure constraints
        data.isProfileComplete = true; 
        data.onboardingStep = 4;
        
        updatedProfile = await userProfileService.createUserProfile(data);
        toast.success("Student profile created successfully!");
        if (onSuccess) onSuccess(updatedProfile);

      } else if (existingProfile) {
        // Updating current user's profile
        if (isStudent) {
          Object.keys(existingProfile).forEach((key) => {
            if (!studentEditableFields.includes(key)) {
              data[key] = existingProfile[key];
            }
          });
        } else if (isTeacher) {
          data.isProfileComplete = true;
          data.onboardingStep = 4;
        }
        updatedProfile = await userProfileService.updateUserProfile(
          existingProfile.$id,
          { ...data }
        );
        dispatch(addProfile({ data: updatedProfile }));
        toast.success("Profile updated successfully!");
        if (onSuccess) onSuccess(updatedProfile);
        
      } else {
        // Creating new profile for self
        data.role = user.labels;
        data.userId = user.$id;
        data.userName = data.userName || user.name;
        updatedProfile = await userProfileService.createUserProfile(data);
        dispatch(addProfile({ data: updatedProfile }));
        toast.success("Profile created successfully!");
        if (onSuccess) onSuccess(updatedProfile);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loader isLoading={true} />;
  }

  return (
    <div className="w-full">
        {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center text-red-700 dark:text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
            {error}
        </div>
        )}

        <FormProvider {...methods}>
        <form
            onSubmit={methods.handleSubmit(handleProfileSubmit)}
            className="space-y-6"
        >
            <PersonalDetailsSection
                isFieldEditable={isFieldEditable}
                formMode={formMode}
                targetUserId={targetUserId}
            />

            <AcademicAndBatchSection
                isTeacher={isTargetTeacher}
                isStudent={isTargetStudent}
                isUserProfile={isUserProfile}
                isFieldEditable={isFieldEditable}
                formMode={formMode}
            />

            <div className="flex items-center justify-end gap-3 pt-3 sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 p-4 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 mt-6 rounded-b-3xl">
                 {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Cancel
                    </button>
                )}
                <button
                    disabled={isSubmitting}
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                >
                    {isSubmitting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                        Saving...
                    </>
                    ) : (
                    <>
                        <Save size={16} />
                        {formMode === "edit" ? "Save Changes" : "Save Profile"}
                    </>
                    )}
                </button>
            </div>
        </form>
        </FormProvider>
    </div>
  );
};

export default EmbeddedProfileForm;
