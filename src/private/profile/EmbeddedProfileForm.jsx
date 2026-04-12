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

const EmbeddedProfileForm = ({ explicitUserId, onSuccess, onCancel, defaultBatchId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [othersProfile, setOthersProfile] = useState(null);
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState("create"); // "create" or "edit"

  const dispatch = useDispatch();
  const methods = useForm({
    defaultValues: {
      status: "Active",
      enrollmentStatus: "Active",
      isActive: true,
    }
  });

  const user = useSelector(selectUser);
  const existingProfile = useSelector(selectProfile);
  
  const targetUserId = explicitUserId || user?.$id;
  const isUserProfile = !!explicitUserId && explicitUserId !== user?.$id;

  const isTeacher = user.labels.includes("Teacher");
  const isStudent = !isTeacher;

  const isEditingOwnProfile = !isUserProfile && existingProfile;
  const isEditingStudentProfile = isTeacher && isUserProfile;

  // Define which fields students can edit
  const studentEditableFields = [
    "DOB",
    "email",
    "phone",
    "parentContact",
    "address",
    "profileImage",
    "registerId",
    "studentId",
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
          // Format dates for the form
          const formattedData = {
            ...profileData,
            DOB: profileData.DOB ? profileData.DOB.split("T")[0] : "",
            enrolledAt: profileData.enrolledAt
              ? profileData.enrolledAt.split("T")[0]
              : "",
          };
          methods.reset(formattedData);
        } else if (!isUserProfile) {
          methods.reset({
            userId: user.$id,
            userName: user.name,
            email: user.email,
            phone: user.phone,
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
  }, [methods.reset, targetUserId, existingProfile, isUserProfile, user.$id, defaultBatchId]);

  const handleProfileSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      let updatedProfile;

      if (isUserProfile && othersProfile) {
        // Updating another user's existing profile
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
                isTeacher={isTeacher}
                isStudent={isStudent}
                isUserProfile={isUserProfile}
                isFieldEditable={isFieldEditable}
                formMode={formMode}
            />

            <div className="flex gap-4 pt-4 sticky bottom-4 z-40 bg-white/70 backdrop-blur-xl dark:bg-slate-900/70 border border-white/40 dark:border-slate-800 p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] mt-8 mx-auto">
                 {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                )}
                <button
                    disabled={isSubmitting}
                    type="submit"
                    className="flex-[2] bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-3 px-6 rounded-xl shadow-lg shadow-pink-500/30 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transform hover:-translate-y-0.5 active:scale-[0.99]"
                >
                    {isSubmitting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-3"></div>
                        Saving...
                    </>
                    ) : (
                    <>
                        <Save size={20} className="mr-2" />
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
