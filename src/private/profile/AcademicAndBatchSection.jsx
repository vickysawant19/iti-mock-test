import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  BookOpen,
  Building,
  Clipboard,
  Calendar,
  Users,
  Check,
  X,
  PlusCircle,
  IdCard,
  GraduationCap,
  Activity,
} from "lucide-react";
import CustomInput from "@/components/components/CustomInput";

const AcademicAndBatchSection = ({
  collegeData,
  tradeData,
  batchesData,
  isTeacher,
  isStudent,
  isUserProfile,
  isFieldEditable,
  formMode,
  fetchBatchData,
}) => {
  const { register, watch, setValue } = useFormContext();
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);

  // --- Batch Management Logic ---
  useEffect(() => {
    if (!watch("allBatchIds")) {
      setValue("allBatchIds", []);
    }
    if (formMode === "edit" && watch("batchId")) {
      const currentBatchId = watch("batchId");
      const allBatchIds = watch("allBatchIds") || [];
      const batchExists = allBatchIds.some(
        (item) => item.batchId === currentBatchId
      );

      if (!batchExists && currentBatchId) {
        const currentBatch = batchesData.find((b) => b.$id === currentBatchId);
        if (currentBatch) {
          setValue("allBatchIds", [
            ...allBatchIds,
            {
              batchId: currentBatchId,
              batchName: currentBatch.BatchName,
            },
          ]);
        }
      }
    }
  }, [watch("batchId"), formMode, setValue, watch, batchesData]);

  const handleToggleBatchForm = () => {
    setShowNewBatchForm((prev) => !prev);
    if (showNewBatchForm) {
      setValue("BatchName", "");
      setValue("start_date", "");
      setValue("end_date", "");
      setValue("isActive", true);
    }
  };

  const addBatchToList = (batchId) => {
    if (!batchId) return;
    const currentAllBatchIds = [...(watch("allBatchIds") || [])];
    if (!currentAllBatchIds.some((item) => item.batchId === batchId)) {
      const batchToAdd = batchesData.find((b) => b.$id === batchId);
      if (batchToAdd) {
        const newBatchObj = {
          batchId: batchId,
          batchName: batchToAdd.BatchName,
        };
        setValue("allBatchIds", [...currentAllBatchIds, newBatchObj]);
      }
    }
  };

  const removeBatchFromList = (batchId) => {
    const currentAllBatchIds = [...(watch("allBatchIds") || [])];
    const newAllBatchIds = currentAllBatchIds.filter(
      (item) => item.batchId !== batchId
    );
    setValue("allBatchIds", newAllBatchIds);
    if (watch("batchId") === batchId) {
      setValue(
        "batchId",
        newAllBatchIds.length > 0 ? newAllBatchIds[0].batchId : ""
      );
    }
  };

  const setActiveBatch = (batchId) => {
    setValue("batchId", batchId);
  };

  const selectedBatchIds = (watch("allBatchIds") || []).map(
    (item) => item.batchId
  );

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

          {/* Active Batch */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Active Batch {isStudent && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Users
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <select
                  {...register("batchId", { required: isStudent })}
                  disabled={!isFieldEditable("batchId")}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  value={watch("batchId") || ""}
                  onChange={(e) => setValue("batchId", e.target.value)}
                >
                  <option value="">Select Active Batch</option>
                  {(watch("allBatchIds") || []).map((batchItem) => (
                    <option key={batchItem.batchId} value={batchItem.batchId}>
                      {batchItem.batchName}
                    </option>
                  ))}
                </select>
              </div>
              {isTeacher && !isUserProfile && formMode === "edit" && (
                <button
                  type="button"
                  onClick={handleToggleBatchForm}
                  className={`px-4 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    showNewBatchForm
                      ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                  }`}
                >
                  {showNewBatchForm ? (
                    <>
                      <X size={18} /> Cancel
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} /> New
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Add Batch to List */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Add Batch to List
            </label>
            <div className="relative">
              <PlusCircle
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    addBatchToList(e.target.value);
                    e.target.value = "";
                  }
                }}
                disabled={!isFieldEditable("batchId")}
              >
                <option value="">Select Batch to Add</option>
                {batchesData.length > 0 &&
                  batchesData
                    .filter((batch) => !selectedBatchIds.includes(batch.$id))
                    .map((batch) => (
                      <option key={batch.$id} value={batch.$id}>
                        {batch.BatchName}
                      </option>
                    ))}
              </select>
            </div>
            {isTeacher && !isUserProfile && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
                {batchesData.length === 0
                  ? "No batches available. Create a new batch."
                  : "Select batches to add them to your list."}
              </p>
            )}
          </div>
        </div>

        {/* Batch Creation Form */}
        {isTeacher &&
          !isUserProfile &&
          (showNewBatchForm || (!watch("batchId") && formMode === "create")) && (
            <div className="mt-6 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                <PlusCircle size={16} />
                Create New Batch
              </h3>
              <div className="space-y-4">
                <CustomInput
                  label="Batch Name"
                  type="text"
                  icon={<Users size={18} className="text-gray-400" />}
                  {...register("BatchName")}
                  placeholder="e.g. 2023-2025 - Electrician - A"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomInput
                    label="Start Date"
                    type="date"
                    icon={<Calendar size={18} className="text-gray-400" />}
                    {...register("start_date")}
                  />
                  <CustomInput
                    label="End Date"
                    type="date"
                    icon={<Calendar size={18} className="text-gray-400" />}
                    {...register("end_date")}
                  />
                </div>
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-300 transition-colors">
                  <input
                    {...register("isActive")}
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    defaultChecked={true}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Set Batch as Active
                  </span>
                </label>

                {formMode === "edit" && showNewBatchForm && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleToggleBatchForm}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !watch("BatchName") ||
                          !watch("collegeId") ||
                          !watch("tradeId")
                        ) {
                          alert("Please fill all required fields");
                          return;
                        }
                        await fetchBatchData();
                        handleToggleBatchForm();
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                    >
                      Save Batch
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Selected Batches List */}
        {(watch("allBatchIds") || []).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Selected Batches
            </h3>
            <div className="grid gap-2">
              {(watch("allBatchIds") || []).map((batchItem) => {
                const batch = batchesData.find(
                  (b) => b.$id === batchItem.batchId
                );
                const isActive = watch("batchId") === batchItem.batchId;
                return (
                  <div
                    key={batchItem.batchId}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isActive
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isActive ? "bg-blue-500" : "bg-gray-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {batchItem.batchName}
                        </p>
                        {batch?.teacherName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Teacher: {batch.teacherName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => setActiveBatch(batchItem.batchId)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors dark:text-gray-400 dark:hover:bg-blue-900/30"
                          title="Set as Active"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeBatchFromList(batchItem.batchId)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors dark:text-gray-400 dark:hover:bg-red-900/30"
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
