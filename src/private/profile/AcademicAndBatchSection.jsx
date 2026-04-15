import React from "react";
import { useFormContext } from "react-hook-form";
import {
  Activity,
} from "lucide-react";

const AcademicAndBatchSection = ({
  isTeacher,
  isStudent,
  isUserProfile,
  isFieldEditable,
  formMode,
}) => {
  const { register, watch, setValue } = useFormContext();

  return (
    <div className="space-y-6">
      {/* --- Section 1: Professional Details (Teachers Only) --- */}
      {isTeacher && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="flex items-center mb-6 border-b border-white/40 dark:border-slate-800 pb-4 relative z-10">
            <div className="p-2.5 bg-purple-100/80 dark:bg-purple-900/40 rounded-xl mr-3 shadow-inner">
              <Activity className="text-purple-600 dark:text-purple-400" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Professional Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your experience and professional information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
          </div>
        </div>
      )}

      {/* Student Identification section removed — studentId & registerId managed separately */}


      {/* --- Section 3: Enrollment Details removed --- */}
      {/* enrolledAt, enrollmentStatus and status are set exclusively
          through the teacher approval flow (ApprovalReviewModal) */}
    </div>
  );
};

export default AcademicAndBatchSection;
