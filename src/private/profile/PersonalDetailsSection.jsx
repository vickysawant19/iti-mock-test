import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import CustomInput from "@/components/components/CustomInput";
import userProfileService from "@/services/auth/userProfileService";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { useDispatch, useSelector } from "react-redux";
import { addProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";

const PersonalDetailsSection = ({ isFieldEditable, formMode, targetUserId }) => {
  const { register, watch, setValue } = useFormContext();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const currentImageUrl = watch("profileImage");
  const userName = watch("userName") || "User Profile";

  const handleImageUpdate = async (newUrl) => {
    setValue("profileImage", newUrl, { shouldDirty: true, shouldValidate: true });

    if (formMode === "edit") {
      const profile = await userProfileService.getUserProfile(targetUserId);
      if (profile && profile.$id) {
         const updatedProfile = await userProfileService.patchUserProfile(profile.$id, { profileImage: newUrl });
         if (user?.$id === targetUserId && updatedProfile) {
           dispatch(addProfile({ data: updatedProfile }));
         }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP AVATAR HEADER CARD ── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50/80 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-800/80 border border-blue-100/80 dark:border-slate-700/80 rounded-2xl shadow-xs">
        <div className="relative shrink-0">
          <InteractiveAvatar 
             src={currentImageUrl}
             fallbackText={userName?.charAt(0) || "U"}
             userId={targetUserId}
             editable={isFieldEditable("profileImage")}
             onImageUpdate={handleImageUpdate}
             className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-4 ring-white dark:ring-slate-700 shadow-md"
          />
          <input type="hidden" {...register("profileImage")} />
        </div>
        <div className="flex-1 text-center sm:text-left min-w-0">
          <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            {userName}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {isFieldEditable("profileImage") 
              ? "Click avatar photo to upload or change profile image" 
              : "Profile Picture"}
          </p>
        </div>
      </div>

      {/* ── SECTION TITLE ── */}
      <div className="flex items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl mr-3 border border-indigo-100 dark:border-indigo-900/60">
          <User className="text-indigo-600 dark:text-indigo-400" size={18} />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Personal Details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Basic personal information and contact details
          </p>
        </div>
      </div>

      {/* ── FORM INPUTS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <CustomInput
          label="Full Name"
          required={true}
          type="text"
          icon={<User size={18} className="text-gray-400" />}
          {...register("userName", { required: true })}
          disabled={!isFieldEditable("userName")}
          placeholder="e.g. John Doe"
        />

        <CustomInput
          label="Date of Birth"
          required={true}
          type="date"
          icon={<Calendar size={18} className="text-gray-400" />}
          {...register("DOB", { required: true })}
          disabled={!isFieldEditable("DOB")}
        />

        <CustomInput
          label="Email"
          type="email"
          required={true}
          icon={<Mail size={18} className="text-gray-400" />}
          {...register("email", { required: true })}
          disabled={!isFieldEditable("email")}
          placeholder="e.g. john@example.com"
        />

        <CustomInput
          label="Phone"
          type="number"
          required={true}
          icon={<Phone size={18} className="text-gray-400" />}
          {...register("phone", { required: true })}
          disabled={!isFieldEditable("phone")}
          placeholder="e.g. 9876543210"
        />

        <CustomInput
          label="Parent Contact"
          type="number"
          required={true}
          icon={<Phone size={18} className="text-gray-400" />}
          {...register("parentContact", { required: true })}
          disabled={!isFieldEditable("parentContact")}
          placeholder="e.g. 9876543210"
        />

        <div className="sm:col-span-2">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-3.5 top-3.5 text-slate-400"
              size={18}
            />
            <textarea
              {...register("address", { required: true })}
              disabled={!isFieldEditable("address")}
              rows={3}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none dark:text-white"
              placeholder="Enter full residential address"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default PersonalDetailsSection;
