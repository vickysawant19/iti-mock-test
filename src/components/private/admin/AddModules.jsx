import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Save,
  X,
  BookOpen,
  Clock,
  FileText,
  Target,
  ClipboardList,
  LayoutGrid,
} from "lucide-react";

const AddModules = ({ setShow, setModules, modules, moduleId }) => {
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (moduleId !== "" && modules?.syllabus) {
      const selectedModule = modules.syllabus.find(
        (m) => m.moduleId === moduleId
      );
      reset(selectedModule || {});
    } else {
      reset({
        moduleId: "",
        moduleName: "",
        moduleDescription: "",
        moduleDuration: "",
        learningOutcome: "",
        assessmentCriteria: "",
        hours: "",
        topics: [],
      });
    }
  }, [moduleId, modules, reset]);

  const handleAddModules = async (formData) => {
    try {
      setModules((prev) => {
        let existing = prev.syllabus.find(
          (m) => m.moduleId === formData.moduleId
        );
        return {
          ...prev,
          syllabus: existing
            ? prev.syllabus.map((m) =>
                m.moduleId === formData.moduleId
                  ? { ...m, ...formData, topics: m?.topics || [] }
                  : m
              )
            : [...prev.syllabus, { ...formData, topics: [] }],
        };
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Module Information
          </h3>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit(handleAddModules)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Module ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <LayoutGrid className="w-4 h-4 text-gray-500" />
                Module ID *
              </label>
              <input
                {...register("moduleId", { required: "Module ID is required" })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter module ID"
              />
              {errors.moduleId && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.moduleId.message}
                </span>
              )}
            </div>

            {/* Module Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 text-gray-500" />
                Module Name *
              </label>
              <input
                {...register("moduleName", {
                  required: "Module name is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter module name"
              />
              {errors.moduleName && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.moduleName.message}
                </span>
              )}
            </div>

            {/* Module Duration */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4 text-gray-500" />
                Module Duration (hours) *
              </label>
              <input
                type="number"
                {...register("moduleDuration", {
                  required: "Duration is required",
                  min: { value: 1, message: "Minimum 1 hour required" },
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter duration in hours"
              />
              {errors.moduleDuration && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.moduleDuration.message}
                </span>
              )}
            </div>

            {/* Assessment Criteria */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ClipboardList className="w-4 h-4 text-gray-500" />
                Assessment Criteria *
              </label>
              <input
                {...register("assessmentCriteria", {
                  required: "Assessment criteria is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter assessment criteria"
              />
              {errors.assessmentCriteria && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.assessmentCriteria.message}
                </span>
              )}
            </div>

            {/* Module Description */}
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 text-gray-500" />
                Module Description *
              </label>
              <textarea
                {...register("moduleDescription", {
                  required: "Description is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                rows="3"
                placeholder="Enter module description"
              />
              {errors.moduleDescription && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.moduleDescription.message}
                </span>
              )}
            </div>

            {/* Learning Outcome */}
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Target className="w-4 h-4 text-gray-500" />
                Learning Outcome *
              </label>
              <textarea
                {...register("learningOutcome", {
                  required: "Learning outcome is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                rows="2"
                placeholder="Enter learning outcomes"
              />
              {errors.learningOutcome && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.learningOutcome.message}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => ""}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddModules;
