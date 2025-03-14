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
    <div className="bg-blue-50 h-screen shadow-xl overflow-y-scroll relative">
      {/* Header */}
      <div className="border-b border-gray-100 bg-blue-100 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-800">
              {module.moduleName}
            </h2>
          </div>
          <div className="flex">
            <button
              onClick={() => setShow(new Set().add("AddModules"))}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDeleteModule}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
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
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-gray-900 font-medium">Module Duration</p>
              <p className="text-gray-600">{module.moduleDuration} hours</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-gray-900 font-medium">Total Hours</p>
              <p className="text-gray-600">{module.hours} hours</p>
            </div>
          </div>
        </div>

        {/* Learning Outcome */}
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-gray-500 mt-1" />
          <div>
            <h3 className="text-gray-900 font-medium mb-2">Learning Outcome</h3>
            <p className="text-gray-600">{module.learningOutcome}</p>
          </div>
        </div>

        {/* Description */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-500 mt-1" />
          <div>
            <h3 className="text-gray-900 font-medium mb-2">Description</h3>
            <p className="text-gray-600">{module.moduleDescription}</p>
          </div>
        </div>

        {/* Job Evaluation Points */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-500 mt-1" />
          <div>
            <h3 className="text-gray-900 font-medium mb-2">
              Job Evaluation Points:
            </h3>
            <ol>
              {module?.evalutionPoints?.map((item) => (
                <li key={item.id}>
                  <p className="text-gray-600">
                    {item.id}. {item.evaluation} - {item.points}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Assessment Paper Id */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-500 mt-1" />
          <div>
            <h3 className="text-gray-900 font-medium mb-2">
              Assessment Paper Id:
            </h3>
            <p className="text-gray-600">{module.assessmentPaperId}</p>
          </div>
        </div>

        {/* Images with absolute (overlay) preview */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-500 mt-1" />
          <div>
            <h3 className="text-gray-900 font-medium mb-2">Images:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {module?.images &&
                module.images.length > 0 &&
                module.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative"
                    onMouseEnter={() => setPreviewImage(image)}
                    onMouseLeave={() => setPreviewImage(null)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                      <IKImage
                        urlEndpoint="https://ik.imagekit.io/71amgqe4f"
                        path={image.url.split("/").slice(-2).join("/")}
                        transformation={[
                          { height: 300, width: 300, cropMode: "extract" },
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
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onMouseEnter={() => setPreviewImage(previewImage)}
          // onMouseLeave={() => setPreviewImage(null)}
        >
          <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-100 border">
            <IKImage
              urlEndpoint="https://ik.imagekit.io/71amgqe4f"
              path={previewImage.url.split("/").slice(-2).join("/")}
              className="h-96 w-auto"
            />
            <button
              className="absolute top-2 right-2 p-2 bg-red-50 rounded-full hover:bg-red-100 focus:outline-none"
              type="button"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowModules;
