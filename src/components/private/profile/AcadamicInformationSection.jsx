import React from "react";
import { useFormContext } from "react-hook-form";
import { BookOpen, Building, Clipboard, Calendar } from "lucide-react";
import CustomInput from "../../components/CustomInput";

const AcademicInformationSection = ({
  collegeData,
  tradeData,
  isFieldEditable,
  formMode,
}) => {
  const { register, watch } = useFormContext();

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm mb-6">
      <div className="flex items-center mb-4 border-b pb-2">
        <BookOpen className="mr-2 text-blue-500" size={20} />
        <h2 className="text-lg font-semibold text-gray-700">
          Academic Information
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center mb-1">
            <Building size={18} className="text-gray-500 mr-1" />
            <label className="text-gray-600">
              College <span className="text-red-500">*</span>
            </label>
          </div>
          <select
            {...register("collegeId", { required: true })}
            disabled={!isFieldEditable("collegeId")}
            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          >
            <option value="">Select College</option>
            {collegeData.map((college) => (
              <option key={college.$id} value={college.$id}>
                {college.collageName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center mb-1">
            <BookOpen size={18} className="text-gray-500 mr-1" />
            <label className="text-gray-600">
              Trade <span className="text-red-500">*</span>
            </label>
          </div>
          <select
            {...register("tradeId", { required: true })}
            disabled={!isFieldEditable("tradeId")}
            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          >
            <option value="">Select Trade</option>
            {tradeData.map((trade) => (
              <option key={trade.$id} value={trade.$id}>
                {trade.tradeName}
              </option>
            ))}
          </select>
        </div>

        <CustomInput
          label="Student ID/Roll Number"
          type="number"
          icon={<Clipboard size={18} className="text-gray-500" />}
          {...register("studentId")}
          disabled={!isFieldEditable("studentId")}
        />

        <CustomInput
          label="Registration ID"
          type="text"
          icon={<Clipboard size={18} className="text-gray-500" />}
          {...register("registerId")}
          disabled={!isFieldEditable("registerId")}
        />

        <CustomInput
          required={true}
          label="Enrollment Date"
          type="date"
          icon={<Calendar size={18} className="text-gray-500" />}
          {...register("enrolledAt", { required: true })}
          disabled={!isFieldEditable("enrolledAt")}
        />
      </div>

      {/* Display selected college and trade names if present */}
      {(watch("collegeId") || watch("tradeId")) && (
        <div className="mt-4 bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            {watch("collegeId") &&
              collegeData.find((c) => c.$id === watch("collegeId")) && (
                <span className="font-medium">
                  College:{" "}
                  {
                    collegeData.find((c) => c.$id === watch("collegeId"))
                      .collageName
                  }
                </span>
              )}
            {watch("collegeId") && watch("tradeId") && " | "}
            {watch("tradeId") &&
              tradeData.find((t) => t.$id === watch("tradeId")) && (
                <span className="font-medium">
                  Trade:{" "}
                  {tradeData.find((t) => t.$id === watch("tradeId")).tradeName}
                </span>
              )}
          </p>
        </div>
      )}
    </div>
  );
};

export default AcademicInformationSection;
