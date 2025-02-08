import React from "react";
import {
  Clock,
  Edit2,
  BookOpen,
  Target,
  FileText,
  Calendar,
  Delete,
  DeleteIcon,
} from "lucide-react";

const ShowModules = ({ module, setShow, handleDeleteModule }) => {
  if (!module) return null;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-800">
              {module.moduleName}
            </h2>
          </div>
          <div className="flex ">
            <button
              onClick={() => setShow(new Set().add("AddModules"))}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => handleDeleteModule()}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
            >
              <DeleteIcon className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Duration and Hours */}
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

        {/* Module Description */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-500 mt-1" />
          <div>
            <h3 className="text-gray-900 font-medium mb-2">Description</h3>
            <p className="text-gray-600">{module.moduleDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowModules;
