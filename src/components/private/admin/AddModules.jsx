import React, { useEffect, useState } from "react";
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
import PaperPreview from "./module-assignment/ModuleTestPreview";
import { toast } from "react-toastify";
import { format } from "date-fns";

import useModuleEvalutionPoints from "./module-assignment/ModuleEvalutionPoints";
import ImageUploader from "./image-upload/ImageUpload";
import { IKImage } from "imagekitio-react";

const AddModules = ({
  setShow,
  setModules,
  modules,
  moduleId,
  moduleTest,
  trade,
  isPractical
}) => {
  const { savePaper, createPaper, isLoading, isError, error, data } =
    moduleTest;

  const {
    data: evalutionsPoints,
    isLoading: loadingEval,
    isError: evalisError,
    error: errorEval,
    generateEvalutionPoint,
  } = useModuleEvalutionPoints();

  // Local state for paper data and modal visibility
  const [paperData, setPaperData] = useState(null);
  const [showPaperModal, setShowPaperModal] = useState(false);

  const [evalPoints, setEvalPoints] = useState(null);
  const [images, setImages] = useState([]);

  // Setup react-hook-form and watch for assessmentPaperId
  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setValue,
    reset,
    watch,
  } = useForm();
  const assessmentPaperId = watch("assessmentPaperId");

  // Helper to generate a unique 10-character paper ID.
  // Here we generate 4 random letters and append a 12-digit timestamp.
  // Note: This produces a 16-character string. Adjust numbers if you want exactly 10 characters.
  const generatePaperId = () => {
    const randomChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let initials = randomChar
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")
      .slice(0, 4);
    const timestamp = format(new Date(), "yyMMddHHmmss");
    return initials + timestamp;
  };

  // Function to generate a new paper and open the modal to preview it.
  const createNewPaper = async () => {
    try {
      const moduleName = getValues("moduleName");
      const newPaperId = generatePaperId();
      const generatedPaper = await createPaper({
        paperId: newPaperId,
        practicalName: moduleName,
      });
      setPaperData(generatedPaper);
      setShowPaperModal(true); // open modal to show preview
    } catch (err) {
      console.log("Error creating paper: ", err);
      toast.error("Error generating paper");
    }
  };

  // Function to save the paper to the database, update the form,
  // and automatically save the module using current form data.
  const saveNewPaper = async () => {
    if (!paperData) return;
    try {
      const savedPaper = await savePaper(paperData);
      // Update the form with the saved paper's ID
      setValue("assessmentPaperId", savedPaper.paperId);
      toast.success("Paper saved successfully.");
      setShowPaperModal(false);

      // Automatically save the module using current form data.
      const formData = getValues();
      if (!formData.assessmentPaperId) {
        toast.error("Paper ID is missing. Please try again.");
        return;
      }
      await handleAddModules(formData);
    } catch (err) {
      console.log("Error saving paper", err);
      toast.error("Error saving paper");
    }
  };

  // Save the module; ensure a paper has been generated before saving.
  const handleAddModules = async (formData) => {
    // if (!formData.assessmentPaperId) {
    //   toast.error(
    //     "Please generate and save the paper before saving the module."
    //   );
    //   return;
    // }
    try {
      setModules((prev) => {
        let existing = prev.syllabus.find(
          (m) => m.moduleId.toUpperCase() === formData.moduleId.toUpperCase()
        );
        return {
          ...prev,
          syllabus: existing
            ? prev.syllabus.map((m) =>
                m.moduleId.toUpperCase() === formData.moduleId.toUpperCase()
                  ? { ...m, ...formData, topics: m?.topics || [] }
                  : m
              )
            : [...prev.syllabus, { ...formData, topics: [] }],
        };
      });
      toast.success("Module saved successfully!");
    } catch (err) {
      console.log("Error saving module:", err);
      toast.error("Error saving module");
    }
  };

  // Reset form fields if moduleId or modules change.
  useEffect(() => {
    if (moduleId !== "" && modules?.syllabus) {
      const selectedModule = modules.syllabus.find(
        (m) => m.moduleId.toUpperCase() === moduleId.toUpperCase()
      );
      reset(selectedModule || {});
      isPractical && setEvalPoints(selectedModule?.evalutionPoints || []);
      setImages(selectedModule?.images || []);
    } else {
      reset({
        moduleId: "",
        moduleName: "",
        moduleDescription: "",
        moduleDuration: "",
        learningOutcome: "",
        assessmentCriteria: "",
        assessmentPaperId: "",
        evalutionsPoints: [],
        images: [],
        hours: "",
        topics: [],
      });
    }
  }, [moduleId, modules, reset]);

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden relative">
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
        {/* Display error if present */}
        {isError && error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(handleAddModules)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Module ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <LayoutGrid className="w-4 h-4 text-gray-500" />
                Module ID *
              </label>
              <input
                {...register("moduleId", {
                  required: "Module ID is required",
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase(); // Transform to uppercase
                  },
                  // validate: (value) => {
                  //   const upperCaseValue = value.toUpperCase();
                  //   return (
                  //     !modules.syllabus.some(
                  //       (module) =>
                  //         module.moduleId.toUpperCase() === upperCaseValue
                  //     ) || "Module ID already exists!"
                  //   );
                  // },
                })}
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

            {/* Module Evaluations */}
           {isPractical && <div className="md:col-span-2 space-y-2 relative">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 text-gray-500" />
                Evaluation Points:
              </label>

              {/* If evaluation points exist, show each in an editable field */}
              <div className="flex flex-col gap-2">
                {evalPoints && evalPoints.length > 0 ? (
                  evalPoints.map((point, index) => (
                    <div key={point.id} className="flex gap-2">
                      <input
                        type="text"
                        value={point.evaluation}
                        onChange={(e) => {
                          // Update the evaluation label for this item.
                          const newLabel = e.target.value;
                          const updatedPoints = [...evalPoints];
                          updatedPoints[index] = {
                            ...updatedPoints[index],
                            evaluation: newLabel,
                          };
                          setValue("evalutionPoints", updatedPoints);
                          setEvalPoints(updatedPoints);
                        }}
                        className="flex-1 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                      <input
                        type="number"
                        value={point.points}
                        onChange={(e) => {
                          const newPoints = e.target.value;
                          const updatedPoints = [...evalPoints];
                          updatedPoints[index] = {
                            ...updatedPoints[index],
                            points: newPoints,
                          };
                          setEvalPoints(updatedPoints);
                        }}
                        className="w-20 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                  ))
                ) : (
                  // If no evaluation points yet, display a readOnly textarea.
                  <p>No Evalution Points Found</p>
                )}
              </div>

              <div className="flex gap-5">
                <button
                  type="button"
                  onClick={async () => {
                    // Use your form value for practicalName.
                    const practicalName = getValues("moduleName");
                    if (!practicalName.trim()) {
                      toast.error(
                        "Please enter a module name to generate evaluation points."
                      );
                      return;
                    }
                    const generated = await generateEvalutionPoint({
                      practicalName,
                    });
                    setEvalPoints(generated);
                    setValue("evalutionPoints", generated);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors h-fit"
                >
                  {loadingEval ? "Generating..." : "Generate Evaluation Points"}
                </button>
              </div>

              {errors.evalutionPoints && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errors.evalutionPoints.message}
                </span>
              )}

              {errorEval && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {errorEval}
                </span>
              )}
            </div>}


            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 text-gray-500" />
              Generated Paper:
            </label>

            {/* Display the generated Paper ID if available */}
            {assessmentPaperId && (
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Generated Paper ID:
                </label>
                <p className="p-2 bg-gray-100 rounded">{assessmentPaperId}</p>
              </div>
            )}
          </div>

          <div className="flex gap-5">
            <button
              type="button"
              onClick={createNewPaper}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isLoading
                ? "Generating..."
                : assessmentPaperId
                ? "Generate Again"
                : "Create Paper"}
            </button>
            {paperData && (
              <button
                type="button"
                onClick={() => setShowPaperModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Show Paper
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText className="w-4 h-4 text-gray-500" />
            Upload Images:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images &&
              images.length > 0 &&
              images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                    <IKImage
                      urlEndpoint="https://ik.imagekit.io/71amgqe4f"
                      path={image.url.split("/").slice(-2).join("/")}
                      transformation={[
                        { height: 300, width: 300, cropMode: "pad_resize" },
                      ]}
                      lqip={{ active: true }}
                      className="object-cover w-full h-full"
                      alt={image.name}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Filter out the image that matches the clicked image's id.
                      const updatedImages = images.filter(
                        (img) => img.id !== image.id
                      );
                      setImages(updatedImages);
                      setValue("images", updatedImages);
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Image"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
          </div>

          <ImageUploader
            setValue={setValue}
            setImages={setImages}
            images={images}
            fileName={moduleId || "image"}
            folderName={trade.tradeName
              .split(" ")
              .map((i) => i[0])
              .join("")}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShow(false)}
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

      {/* Modal to show generated paper preview */}
      {showPaperModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Modal overlay */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setShowPaperModal(false)}
          ></div>
          {/* Modal content */}
          <div className="bg-white rounded-lg shadow-lg z-50 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPaperModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Generated Paper Preview</h2>
            {paperData ? (
              <PaperPreview paperData={paperData} setPaperData={setPaperData} />
            ) : (
              <p>No paper data available.</p>
            )}
            <div className="mt-4 flex justify-end gap-4">
              <button
                onClick={() => setShowPaperModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Close
              </button>
              <button
                onClick={saveNewPaper}
                className="px-4 py-2 bg-teal-600 text-white rounded"
              >
                {isLoading ? "Saving..." : "Save Paper"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddModules;
