import React, { useState } from "react";
import {
  Clock,
  Edit2,
  Target,
  FileText,
  Calendar,
  DeleteIcon,
  X,
} from "lucide-react";
import { IKImage } from "imagekitio-react";

const ShowModules = ({ module, setShow, handleDeleteModule }) => {
  const [previewImage, setPreviewImage] = useState();
  if (!module) return null;

  return (
    <div className="bg-blue-50 dark:bg-gray-800 h-screen shadow-xl overflow-y-scroll relative">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-blue-100 dark:bg-gray-700 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              {module.moduleName}
            </h2>
          </div>
          <div className="flex">
            <button
              onClick={() => setShow(new Set().add("AddModules"))}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDeleteModule}
              className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
            >
              <DeleteIcon className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Module Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-gray-900 dark:text-white font-medium">
                Module Duration
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {module.moduleDuration} hours
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-gray-900 dark:text-white font-medium">
                Total Hours
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {module.hours} hours
              </p>
            </div>
          </div>
        </div>

        {/* Learning Outcome */}
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
          <div>
            <h3 className="text-gray-900 dark:text-white font-medium mb-2">
              Learning Outcome
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {module.learningOutcome}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
          <div>
            <h3 className="text-gray-900 dark:text-white font-medium mb-2">
              Description
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {module.moduleDescription}
            </p>
          </div>
        </div>

        {/* Job Evaluation Points */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
          <div>
            <h3 className="text-gray-900 dark:text-white font-medium mb-2">
              Job Evaluation Points:
            </h3>
            <ol>
              {module?.evalutionPoints?.map((item) => (
                <li key={item.id}>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.id}. {item.evaluation} - {item.points}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Assessment Paper Id */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
          <div>
            <h3 className="text-gray-900 dark:text-white font-medium mb-2">
              Assessment Paper Id:
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {module.assessmentPaperId}
            </p>
          </div>
        </div>

        {/* Images with absolute (overlay) preview */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
          <div>
            <h3 className="text-gray-900 dark:text-white font-medium mb-2">
              Images:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {module?.images &&
                module.images.length > 0 &&
                module.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative"
                    onClick={() => setPreviewImage(image)}
                    title="Click to open"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 flex items-center justify-center">
                      <IKImage
                        urlEndpoint="https://ik.imagekit.io/71amgqe4f"
                        path={image.url.split("/").slice(-2).join("/")}
                        transformation={[
                          { height: 300, width: 300, cropMode: "pad_resize" },
                        ]}
                        lqip={{ active: true }}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Absolute (fixed) overlay for image preview */}
      {previewImage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 dark:bg-opacity-80">
          <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800 border dark:border-gray-700">
            <div className="max-h-96 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <IKImage
                urlEndpoint="https://ik.imagekit.io/71amgqe4f"
                path={previewImage.url.split("/").slice(-2).join("/")}
                className="max-h-96"
                onError={(e) => {
                  e.target.onerror = null; // Prevent infinite loops
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML =
                    '<div class="w-auto flex items-center justify-center text-gray-500 dark:text-gray-400 m-10">Failed to load image</div>';
                }}
              />
              <button
                className="absolute top-2 right-2 p-2 bg-red-50 dark:bg-red-900 rounded-full hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none"
                type="button"
                onClick={() => setPreviewImage(null)}
              >
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowModules;
