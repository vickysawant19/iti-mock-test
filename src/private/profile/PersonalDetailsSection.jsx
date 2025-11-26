import React from "react";
import { useFormContext } from "react-hook-form";
import { User, Phone, Mail, MapPin, Calendar, Image } from "lucide-react";
import CustomInput from "@/components/components/CustomInput";

const PersonalDetailsSection = ({ isFieldEditable, formMode }) => {
  const { register } = useFormContext();

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

        <CustomInput
          label="Profile Image URL"
          type="text"
          icon={<Image size={18} className="text-gray-400" />}
          {...register("profileImage")}
          disabled={!isFieldEditable("profileImage")}
          placeholder="https://example.com/image.jpg"
        />

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
