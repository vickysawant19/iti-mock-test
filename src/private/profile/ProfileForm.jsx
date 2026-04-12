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
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 w-full overflow-x-hidden font-sans">
      {/* Ambient Animated Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-white/40 dark:border-slate-700 hover:shadow-md"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isTeacher
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              }`}
            >
              {isTeacher ? "Teacher View" : "Student View"}
            </div>
          </div>
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
            {formMode === "edit" ? "Edit Profile" : "Create Profile"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
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
