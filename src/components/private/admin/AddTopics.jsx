import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Save,
  X,
  BookOpen,
  Clock,
  FileText,
  ClipboardList,
  Library,
} from "lucide-react";

const AddTopics = ({ moduleId, topicId, subjectId, modules, setModules }) => {
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (moduleId && topicId) {
      reset(
        modules.syllabus
          .find((m) => m.moduleId === moduleId)
          .topics.find((t) => t.topicId === topicId) || {}
      );
    } else {
      reset({
        topicId: "",
        topicName: "",
        topicHours: "",
        topicAssessment: "",
        topicResource: "",
      });
    }
  }, [moduleId, subjectId, reset, modules]);

  const onSubmit = (formData) => {
    setModules((prev) => {
      let existing = prev.syllabus.find((m) => m.moduleId === moduleId);

      let existingTopic = existing
        ? existing?.topics?.find((t) => t.topicId === formData.topicId)
        : undefined;

      return {
        ...prev,
        syllabus: existing
          ? prev.syllabus.map((m) =>
              m.moduleId === moduleId
                ? {
                    ...m,
                    topics: existingTopic
                      ? m.topics.map((t) =>
                          t.topicId == formData.topicId
                            ? {
                                ...t,
                                ...formData,
                                topicResource:
                                  typeof formData.topicResource === "string"
                                    ? formData.topicResource.split(",")
                                    : formData.topicResource || [],
                              }
                            : t
                        )
                      : [
                          ...m?.topics,
                          {
                            ...formData,
                            topicResource:
                              typeof formData.topicResource === "string"
                                ? formData.topicResource.split(",")
                                : formData.topicResource || [],
                          },
                        ],
                  }
                : m
            )
          : [...prev.syllabus],
      };
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Topic Information
          </h3>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Topic ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 text-gray-500" />
                Topic ID *
              </label>
              <input
                {...register("topicId", { required: "Topic ID is required" })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter topic ID"
              />
              {errors.topicId && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.topicId.message}
                </span>
              )}
            </div>

            {/* Topic Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Library className="w-4 h-4 text-gray-500" />
                Topic Name *
              </label>
              <input
                {...register("topicName", {
                  required: "Topic name is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter topic name"
              />
              {errors.topicName && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.topicName.message}
                </span>
              )}
            </div>

            {/* Topic Hours */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4 text-gray-500" />
                Topic Hours *
              </label>
              <input
                type="number"
                {...register("topicHours", {
                  required: "Hours are required",
                  min: { value: 1, message: "Minimum 1 hour required" },
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter hours"
              />
              {errors.topicHours && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.topicHours.message}
                </span>
              )}
            </div>

            {/* Topic Resource */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Library className="w-4 h-4 text-gray-500" />
                Topic Resource *
              </label>
              <input
                {...register("topicResource", {
                  required: "Resource is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter resource details"
              />
              {errors.topicResource && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.topicResource.message}
                </span>
              )}
            </div>

            {/* Topic Assessment */}
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ClipboardList className="w-4 h-4 text-gray-500" />
                Topic Assessment *
              </label>
              <textarea
                {...register("topicAssessment", {
                  required: "Assessment details are required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                rows="3"
                placeholder="Enter assessment details"
              />
              {errors.topicAssessment && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.topicAssessment.message}
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
              Save Topic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTopics;
