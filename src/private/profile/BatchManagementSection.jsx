import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Users, Clipboard, Calendar, Check, X, PlusCircle } from "lucide-react";
import CustomInput from "@/components/components/CustomInput";

const BatchManagementSection = ({
  batchesData,
  isTeacher,
  isStudent,
  isUserProfile,
  isFieldEditable,
  formMode,
  fetchBatchData,
}) => {
  const { watch, setValue, register } = useFormContext();
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);

  const handleToggleBatchForm = () => {
    setShowNewBatchForm((prev) => !prev);
    // Clear batch form fields when hiding
    if (showNewBatchForm) {
      setValue("BatchName", "");
      setValue("start_date", "");
      setValue("end_date", "");
      setValue("isActive", true);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-xs mb-6">
      <div className="flex items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <Users className="mr-2 text-blue-500 dark:text-blue-400" size={20} />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Batch & Status
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center mb-1">
            <Users
              size={18}
              className="text-gray-500 dark:text-gray-400 mr-1"
            />
            <label className="text-gray-600 dark:text-gray-400">
              Active Batch
              {isStudent && <span className="text-red-500">*</span>}
            </label>
          </div>
          <div className="flex items-center">
            <select
              {...register("batchId", {
                required: isStudent,
              })}
              disabled={!isFieldEditable("batchId")}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
              value={watch("batchId") || ""}
              onChange={(e) => setValue("batchId", e.target.value)}
            >
              <option value="">Select Active Batch</option>
              {(batchesData || []).map((batchItem) => (
                <option key={batchItem.$id} value={batchItem.$id}>
                  {batchItem.BatchName}
                </option>
              ))}
            </select>
            {/* New Batch Button for Teachers */}
            {isTeacher && !isUserProfile && formMode === "edit" && (
              <button
                type="button"
                onClick={handleToggleBatchForm}
                className={`ml-2 p-2 rounded-md ${
                  showNewBatchForm
                    ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                }`}
                title={
                  showNewBatchForm ? "Cancel new batch" : "Create new batch"
                }
              >
                {showNewBatchForm ? <X size={18} /> : <Users size={18} />}
              </button>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center mb-1">
            <Clipboard
              size={18}
              className="text-gray-500 dark:text-gray-400 mr-1"
            />
            <label className="text-gray-600 dark:text-gray-400">
              Enrollment Status <span className="text-red-500">*</span>
            </label>
          </div>
          <select
            {...register("enrollmentStatus", { required: true })}
            disabled={!isFieldEditable("enrollmentStatus")}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
            <option value="Graduated">Graduated</option>
          </select>
          <div className="mt-4">
            <div className="flex items-center mb-1">
              <Clipboard
                size={18}
                className="text-gray-500 dark:text-gray-400 mr-1"
              />
              <label className="text-gray-600 dark:text-gray-400">
                Status <span className="text-red-500">*</span>
              </label>
            </div>
            <select
              {...register("status", { required: true })}
              disabled={!isFieldEditable("status")}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>
      {/* Batch Creation Section - Only visible for teachers */}
      {isTeacher &&
        !isUserProfile &&
        (showNewBatchForm || (!watch("batchId") && formMode === "create")) && (
          <div className="bg-blue-50 dark:bg-gray-900 p-4 rounded-lg mt-4 border border-blue-100 dark:border-gray-800">
            <h3 className="font-medium mb-3 text-blue-700 dark:text-blue-300 flex items-center">
              <Users size={16} className="mr-2" />
              Create New Batch
            </h3>
            <div className="space-y-3">
              <CustomInput
                label="Batch Name"
                type="text"
                icon={
                  <Users
                    size={18}
                    className="text-gray-500 dark:text-gray-400"
                  />
                }
                {...register("BatchName")}
                placeholder="Enter batch name e.g: 2022-2023 - Your Name -"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CustomInput
                  label="Start Date"
                  type="date"
                  icon={
                    <Calendar
                      size={18}
                      className="text-gray-500 dark:text-gray-400"
                    />
                  }
                  {...register("start_date")}
                />
                <CustomInput
                  label="End Date"
                  type="date"
                  icon={
                    <Calendar
                      size={18}
                      className="text-gray-500 dark:text-gray-400"
                    />
                  }
                  {...register("end_date")}
                />
              </div>
              <div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    {...register("isActive")}
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked={true}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:rtl:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Batch Active
                  </span>
                </label>
              </div>
              {/* Save Batch Button - Only visible in edit mode */}
              {formMode === "edit" && showNewBatchForm && (
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={handleToggleBatchForm}
                    className="mr-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-2 px-4 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200 flex items-center"
                  >
                    <X size={16} className="mr-1" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      // Validate fields
                      if (
                        !watch("BatchName") ||
                        !watch("collegeId") ||
                        !watch("tradeId")
                      ) {
                        alert("Please fill all required fields for the batch");
                        return;
                      }
                      // Handle batch creation here if needed, then refresh batch list
                      await fetchBatchData();
                      handleToggleBatchForm();
                    }}
                    className="bg-green-600 dark:bg-green-700 text-white py-2 px-4 rounded-sm hover:bg-green-700 dark:hover:bg-green-800 transition duration-200 flex items-center"
                  >
                    <Check size={16} className="mr-1" />
                    Save Batch
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default BatchManagementSection;
