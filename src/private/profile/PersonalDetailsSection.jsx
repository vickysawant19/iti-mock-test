import React from "react";
import { useFormContext } from "react-hook-form";
import { User, Phone, Mail, MapPin, Calendar, Image } from "lucide-react";
import CustomInput from "@/components/components/CustomInput";

const PersonalDetailsSection = ({ isFieldEditable, formMode }) => {
  const { register } = useFormContext();

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-xs mb-6">
      <div className="flex items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <User className="mr-2 text-blue-500 dark:text-blue-400" size={20} />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Personal Details
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomInput
          label="Full Name"
          required={true}
          type="text"
          icon={<User size={18} className="text-gray-500 dark:text-gray-400" />}
          {...register("userName", { required: true })}
          disabled={!isFieldEditable("userName")}
        />

        <CustomInput
          label="Date of Birth"
          required={true}
          type="date"
          icon={
            <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
          }
          {...register("DOB", { required: true })}
          disabled={!isFieldEditable("DOB")}
        />

        <CustomInput
          label="Email"
          type="email"
          required={true}
          icon={<Mail size={18} className="text-gray-500 dark:text-gray-400" />}
          {...register("email", { required: true })}
          disabled={!isFieldEditable("email")}
        />

        <CustomInput
          label="Phone"
          type="number"
          required={true}
          icon={
            <Phone size={18} className="text-gray-500 dark:text-gray-400" />
          }
          {...register("phone", { required: true })}
          disabled={!isFieldEditable("phone")}
        />

        <CustomInput
          label="Parent Contact"
          type="number"
          required={true}
          icon={
            <Phone size={18} className="text-gray-500 dark:text-gray-400" />
          }
          {...register("parentContact", { required: true })}
          disabled={!isFieldEditable("parentContact")}
        />

        <CustomInput
          label="Profile Image URL"
          type="text"
          icon={
            <Image size={18} className="text-gray-500 dark:text-gray-400" />
          }
          {...register("profileImage")}
          disabled={!isFieldEditable("profileImage")}
        />

        <div className="md:col-span-2">
          <div className="flex items-center mb-1">
            <MapPin
              size={18}
              className="text-gray-500 dark:text-gray-400 mr-1"
            />
            <label className="text-gray-600 dark:text-gray-400">
              Address <span className="text-red-500">*</span>
            </label>
          </div>
          <textarea
            {...register("address", { required: true })}
            disabled={!isFieldEditable("address")}
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          />
        </div>
      </div>

      {/* Conditional help text for edit mode */}
      {formMode === "edit" && !isFieldEditable("userName") && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded-sm">
          <p>
            Some fields are not editable in your current role. Please contact
            your administrator for changes.
          </p>
        </div>
      )}
    </div>
  );
};

export default PersonalDetailsSection;
