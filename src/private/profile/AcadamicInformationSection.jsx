import React from "react";
import { useFormContext } from "react-hook-form";
import { BookOpen, Building, Clipboard, Calendar } from "lucide-react";
import CustomInput from "@/components/components/CustomInput";

const AcademicInformationSection = ({
  isFieldEditable,
  formMode,
}) => {
  const { register, watch } = useFormContext();

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-xs mb-6">
      <div className="flex items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <BookOpen className="mr-2 text-blue-500 dark:text-blue-400" size={20} />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Academic Information
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <CustomInput
          label="Student ID/Roll Number"
          type="number"
          icon={
            <Clipboard size={18} className="text-gray-500 dark:text-gray-400" />
          }
          {...register("studentId")}
          disabled={!isFieldEditable("studentId")}
        />

        <CustomInput
          label="Registration ID"
          type="text"
          icon={
            <Clipboard size={18} className="text-gray-500 dark:text-gray-400" />
          }
          {...register("registerId")}
          disabled={!isFieldEditable("registerId")}
        />

        <CustomInput
          required={true}
          label="Enrollment Date"
          type="date"
          icon={
            <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
          }
          {...register("enrolledAt", { required: true })}
          disabled={!isFieldEditable("enrolledAt")}
        />
      </div>

    </div>
  );
};

export default AcademicInformationSection;
