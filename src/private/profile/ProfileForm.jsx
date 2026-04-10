import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";

import EmbeddedProfileForm from "./EmbeddedProfileForm";

const ProfileForm = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  
  const user = useSelector(selectUser);
  const existingProfile = useSelector(selectProfile);
  const isTeacher = user?.labels?.includes("Teacher");
  
  const isUserProfile = !!userId;
  const isEditingOwnProfile = !isUserProfile && existingProfile;
  const isEditingStudentProfile = isTeacher && isUserProfile;
  const formMode = (isUserProfile || existingProfile) ? "edit" : "create";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isTeacher
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              }`}
            >
              {isTeacher ? "Teacher" : "Student"}
            </div>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formMode === "edit" ? "Edit Profile" : "Create Profile"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isEditingOwnProfile
              ? "Manage your personal and academic information"
              : isEditingStudentProfile
              ? "Update student profile details"
              : "Set up your profile information"}
          </p>
        </div>

        <EmbeddedProfileForm 
           explicitUserId={userId} 
           onSuccess={() => {
              if (isUserProfile) navigate(-1);
              else navigate("/profile/edit");
           }}
        />
      </div>
    </div>
  );
};

export default ProfileForm;
