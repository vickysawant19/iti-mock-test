import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import CustomInput from "@/components/components/CustomInput";
import userProfileService from "@/appwrite/userProfileService";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { useDispatch, useSelector } from "react-redux";
import { addProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";

const PersonalDetailsSection = ({ isFieldEditable, formMode, targetUserId }) => {
  const { register, watch, setValue } = useFormContext();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const currentImageUrl = watch("profileImage");

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
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm mb-6 relative overflow-hidden">
      <div className="flex items-center mb-6 border-b border-white/40 dark:border-slate-800 pb-4 relative z-10">
        <div className="p-2.5 bg-pink-100/80 dark:bg-pink-900/40 rounded-xl mr-3 shadow-inner">
          <User className="text-pink-600 dark:text-pink-400" size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Personal Details
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Basic personal information and contact details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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

        <div className="flex flex-col gap-1.5 items-start">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Profile Picture
          </label>
          <InteractiveAvatar 
             src={currentImageUrl}
             fallbackText={watch("userName")?.charAt(0) || "U"}
             userId={targetUserId}
             editable={isFieldEditable("profileImage")}
             onImageUpdate={handleImageUpdate}
             className="w-24 h-24 sm:w-28 sm:h-28"
          />
          <input type="hidden" {...register("profileImage")} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-3 top-3 text-gray-400"
              size={18}
            />
            <textarea
              {...register("address", { required: true })}
              disabled={!isFieldEditable("address")}
              rows={3}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none"
              placeholder="Enter your full address"
            />
          </div>
        </div>
      </div>

      {/* Conditional help text for edit mode */}
      {formMode === "edit" && !isFieldEditable("userName") && (
        <div className="mt-8 flex items-start gap-4 p-5 bg-slate-100/50 dark:bg-slate-900/40 rounded-2xl border border-white/60 dark:border-slate-800 backdrop-blur-sm">
          <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-0.5 shadow-inner">
            <User size={16} className="text-slate-500 dark:text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
            Some fields are read-only based on your role. Please contact your administrator if you need to update locked information.
          </p>
        </div>
      )}
    </div>
  );
};

export default PersonalDetailsSection;
