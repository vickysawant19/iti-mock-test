import React from "react";
import { useFormContext } from "react-hook-form";
import {
  BookOpen,
  Building,
  Clipboard,
  Calendar,
  Check,
  IdCard,
  GraduationCap,
  Activity,
} from "lucide-react";
import CustomInput from "@/components/components/CustomInput";

const AcademicAndBatchSection = ({
  collegeData,
  tradeData,
  isTeacher,
  isStudent,
  isUserProfile,
  isFieldEditable,
  formMode,
}) => {
  const { register, watch, setValue } = useFormContext();

  return (
    <div className="space-y-6">
      {/* --- Section 1: Academic & Batch Information --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mr-3">
            <GraduationCap
              className="text-blue-600 dark:text-blue-400"
              size={24}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Academic & Batch Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage college, trade, and batch assignments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* College */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              College <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                {...register("collegeId", { required: true })}
                disabled={!isFieldEditable("collegeId")}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              >
                <option value="">Select College</option>
                {collegeData.map((college) => (
                  <option key={college.$id} value={college.$id}>
                    {college.collageName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Trade <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <BookOpen
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                {...register("tradeId", { required: true })}
                disabled={!isFieldEditable("tradeId")}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              >
                <option value="">Select Trade</option>
                {tradeData.map((trade) => (
                  <option key={trade.$id} value={trade.$id}>
                    {trade.tradeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher Specific Fields */}
          {isTeacher && (
            <>
              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Other Specializations (Optional)
                </label>
                <div className="relative">
                  <BookOpen
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="e.g. Fitter, Welder"
                    {...register("specialization")}
                    disabled={!isFieldEditable("specialization")}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Years of Experience (Optional)
                </label>
                <div className="relative">
                  <Activity
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    {...register("experience")}
                    disabled={!isFieldEditable("experience")}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Active Batch has been moved to the Batches nav menu */}
        </div>
      </div>

      {/* --- Section 2: Student Identification --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg mr-3">
            <IdCard className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Student Identification
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Official identification numbers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CustomInput
            label="Student ID / Roll Number"
            type="number"
            icon={<IdCard size={18} className="text-gray-400" />}
            {...register("studentId")}
            disabled={!isFieldEditable("studentId")}
            placeholder="e.g. 2023001"
          />

          <CustomInput
            label="Registration ID"
            type="text"
            icon={<Clipboard size={18} className="text-gray-400" />}
            {...register("registerId")}
            disabled={!isFieldEditable("registerId")}
            placeholder="e.g. REG-2023-001"
          />
        </div>
      </div>

      {/* --- Section 3: Enrollment Details --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mr-3">
            <Activity
              className="text-emerald-600 dark:text-emerald-400"
              size={24}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Enrollment & Status
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current status and enrollment dates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CustomInput
            required={true}
            label="Enrollment Date"
            type="date"
            icon={<Calendar size={18} className="text-gray-400" />}
            {...register("enrolledAt", { required: true })}
            disabled={!isFieldEditable("enrolledAt")}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Enrollment Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Activity
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                {...register("enrollmentStatus", { required: true })}
                disabled={!isFieldEditable("enrollmentStatus")}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Current Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Check
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                {...register("status", { required: true })}
                disabled={!isFieldEditable("status")}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicAndBatchSection;
