import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { User, Phone, Mail, MapPin, Calendar, Image, Upload, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import CustomInput from "@/components/components/CustomInput";
import profileImageService from "@/appwrite/profileImageService";
import userProfileService from "@/appwrite/userProfileService";
import { toast } from "react-toastify";

const PersonalDetailsSection = ({ isFieldEditable, formMode, targetUserId }) => {
  const { register, watch, setValue } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);

  const currentImageUrl = watch("profileImage");

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!targetUserId) {
      toast.error("Cannot resolve target user ID.");
      return;
    }

    try {
      setIsUploading(true);
      await profileImageService.uploadProfilePicture(file, targetUserId);
      // Wait slightly to ensure Appwrite recognizes the new file instance view
      await new Promise(res => setTimeout(res, 500));
      
      const newUrl = profileImageService.getProfilePictureView(targetUserId);
      setValue("profileImage", newUrl, { shouldDirty: true, shouldValidate: true });

      // Auto-save if editing an existing profile
      if (formMode === "edit") {
        const profile = await userProfileService.getUserProfile(targetUserId);
        if (profile && profile.$id) {
           await userProfileService.patchUserProfile(profile.$id, { profileImage: newUrl });
        }
      }

      toast.success("Profile image uploaded and saved successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!targetUserId) return;
    try {
      setIsUploading(true);
      await profileImageService.deleteProfilePicture(targetUserId);
      setValue("profileImage", "", { shouldDirty: true, shouldValidate: true });

      // Auto-save empty string if editing an existing profile
      if (formMode === "edit") {
        const profile = await userProfileService.getUserProfile(targetUserId);
        if (profile && profile.$id) {
           await userProfileService.patchUserProfile(profile.$id, { profileImage: "" });
        }
      }

      toast.success("Profile image removed");
    } catch (error) {
      toast.error("Failed to delete image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mr-3">
          <User className="text-blue-600 dark:text-blue-400" size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Profile Picture
          </label>
          <div className="relative group rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors h-[120px] bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            {isUploading ? (
               <div className="flex flex-col items-center justify-center gap-2 text-blue-500">
                 <Loader2 className="w-6 h-6 animate-spin" />
                 <span className="text-xs font-semibold">Uploading & Optimizing...</span>
               </div>
            ) : currentImageUrl ? (
               <div className="relative w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5">
                 <img src={currentImageUrl} alt="Profile" className="w-auto h-full object-cover max-w-full" />
                 {isFieldEditable("profileImage") && (
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                     {/* Change Button */}
                     <div className="flex flex-col items-center justify-center cursor-pointer relative overflow-hidden py-2 px-3 rounded-lg hover:bg-white/20 transition-colors">
                       <Upload className="w-5 h-5 mb-1" />
                       <span className="text-[10px] font-medium uppercase tracking-wider">Change</span>
                       <input
                          type="file"
                          accept="image/jpeg, image/png, image/webp, image/jpg"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={isUploading}
                       />
                     </div>
                     {/* Remove Button */}
                     <div 
                        className="flex flex-col items-center justify-center cursor-pointer py-2 px-3 rounded-lg hover:bg-red-500/80 transition-colors"
                        onClick={handleDeleteImage}
                     >
                        <Trash2 className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Remove</span>
                     </div>
                   </div>
                 )}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 h-full w-full relative">
                 <Image className="w-8 h-8 mb-2 opacity-50" />
                 <span className="text-xs font-medium px-4 text-center">Click or drop to upload avatar</span>
                 {isFieldEditable("profileImage") && (
                   <input
                     type="file"
                     accept="image/jpeg, image/png, image/webp, image/jpg"
                     onChange={handleImageUpload}
                     className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                     disabled={isUploading}
                   />
                 )}
               </div>
            )}
          </div>
          {/* Hidden input to ensure react-hook-form tracks the value upon submission */}
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
        <div className="mt-6 flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="p-1 bg-gray-200 dark:bg-gray-800 rounded-full">
            <User size={14} className="text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Some fields are read-only based on your role. Please contact your administrator if you need to update locked information.
          </p>
        </div>
      )}
    </div>
  );
};

export default PersonalDetailsSection;
