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
  ImageIcon,
} from "lucide-react";
import PaperPreview from "./module-assignment/ModuleTestPreview";
import { toast } from "react-toastify";
import { format } from "date-fns";

import useModuleEvalutionPoints from "./module-assignment/ModuleEvalutionPoints";
import ImageUploader from "./image-upload/ImageUpload";
import { IKImage } from "imagekitio-react";
import { FaMagic } from "react-icons/fa";
import PaperGeneratedNotification from "./module-assignment/PaperGeneratedNotification";
import { appwriteService } from "../../../appwrite/appwriteConfig";
import { generatePaperId } from "./util";
import moduleServices from "@/appwrite/moduleServices";

const AddModules = ({
  setShow,
  newModules,
  setNewModules,
  metaData,
  moduleId,
  moduleTest,
  trade,
  isPractical,
  scrollToItem,
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
  const [isDeleting, setIsDeleting] = useState({});

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (moduleId && newModules.length > 0) {
      const exists = newModules.some(
        (m) => m.moduleId.toUpperCase() === moduleId.toUpperCase()
      );
      setIsEditing(exists);
    } else {
      setIsEditing(false);
    }
  }, [moduleId, newModules]);

  // Setup react-hook-form and watch for assessmentPaperId
  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setValue,
    reset,
    watch,
    setFocus,
  } = useForm();
  const assessmentPaperId = watch("assessmentPaperId");

  // Function to generate a new paper and open the modal to preview it.
  const createNewPaper = async () => {
    try {
      const moduleName = getValues("moduleName");
      const moduleDescription = getValues("moduleDescription");
      const newPaperId = generatePaperId();
      const generatedPaper = await createPaper({
        paperId: newPaperId,
        practicalName: moduleName + moduleDescription,
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
      let existingModule = newModules.find(
        (m) => m.moduleId.toUpperCase() === formData.moduleId.toUpperCase()
      );
      if (existingModule) {
        existingModule = { ...existingModule, ...formData };

        const updatedData = await moduleServices.updateNewModulesData(
          existingModule
        );

        setNewModules((prev) =>
          prev.map((m) =>
            m.moduleId.toUpperCase() === updatedData.moduleId.toUpperCase()
              ? updatedData
              : m
          )
        );
        scrollToItem(updatedData.moduleId.toUpperCase());
        setFocus("moduleId");
        toast.success("Module updated successfully!");
      } else {
        existingModule = { ...metaData, ...formData };
        const createdData = await moduleServices.createNewModulesData(
          existingModule
        );
        console.log("added new module", createdData);
        setNewModules((prev) => {
          return prev.map((m) =>
            m.moduleId.toUpperCase() === createdData.moduleId.toUpperCase()
              ? createdData
              : m
          );
        });
        scrollToItem(createdData.moduleId.toUpperCase());
        setFocus("moduleId");
        toast.success("Module added successfully!");
      }
    } catch (err) {
      console.log("Error saving module:", err);
      toast.error("Error saving module");
    }
  };

  // Reset form fields if moduleId or modules change.
  useEffect(() => {
    if (moduleId !== "" && newModules.length > 0) {
      const selectedModule = newModules.find(
        (m) => m.moduleId.toUpperCase() === moduleId.toUpperCase()
      );
      reset(selectedModule || {});
      isPractical && setEvalPoints(selectedModule?.evalutionPoints || []);
      setImages(selectedModule?.images || []);
    } else {
      reset({
        moduleId: "",
        moduleName: "",
        moduleDuration: 5,
        moduleDescription: "NA",
        learningOutcome: "NA",
        assessmentCriteria: "NA",
        assessmentPaperId: "",
        evalutionsPoints: [],
        images: [],
        hours: 0,
        topics: [],
      });
      setImages([]);
      setEvalPoints([]);
    }
    scrollToItem(moduleId);
  }, [moduleId, newModules, reset]);

  const deleteImage = async ({ fileId }) => {
    if (!fileId) return toast.error("Invalid file ID");

    setIsDeleting((prev) => ({ ...prev, [fileId]: true }));

    try {
      const func = appwriteService.getFunctions();
      const res = await func.createExecution(
        "67d3fa29000adc329a4a",
        JSON.stringify({ action: "delete", fileId })
      );

      // Ensure response exists and is valid JSON
      if (!res?.responseBody) throw new Error("Empty response from server");

      const result = JSON.parse(res.responseBody);

      if (result.success || result.error.includes("file does not exist")) {
        setImages((prevImages) =>
          prevImages.filter((img) => img.id !== fileId)
        );
        setValue(
          "images",
          images.filter((img) => img.id !== fileId)
        );

        toast.success("Image deleted successfully!");
        const formData = getValues();

        await handleAddModules(formData);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(`Delete failed: ${error.message || error}`);
    } finally {
      setIsDeleting((prev) => {
        const updated = { ...prev };
        delete updated[fileId]; // Remove only the current image's loading state
        return updated;
      });
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden relative dark:bg-gray-800 dark:text-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 p-6 dark:bg-gray-700 dark:text-white">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Module Information
          </h3>
        </div>
      </div>

      <div className="p-6">
        {/* Display error if present */}
        {isError && error && (
          <div className="bg-red-100 text-red-700 p-2 rounded-sm mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(handleAddModules)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              {/* Module ID */}
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <LayoutGrid className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Module ID *
              </label>
              <input
                {...register("moduleId", {
                  required: "Module ID is required",
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase(); // Transform to uppercase
                  },
                  validate: (value) => {
                    const upperCaseValue = value.toUpperCase();
                    // Only check for duplicates if adding a new module
                    if (!isEditing) {
                      return (
                        !newModules.some(
                          (module) =>
                            module.moduleId.toUpperCase() === upperCaseValue
                        ) || "Module ID already exists!"
                      );
                    }
                    return true;
                  },
                })}
                disabled={isEditing}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-colors dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
                placeholder="Enter module ID"
              />
              {errors.moduleId && (
                <span className="text-red-500 text-sm flex items-center gap-1 dark:text-red-400">
                  <X className="w-4 h-4" />
                  {errors.moduleId.message}
                </span>
              )}
            </div>

            {/* Module Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Module Name *
              </label>
              <input
                {...register("moduleName", {
                  required: "Module name is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-colors dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
                placeholder="Enter module name"
              />
              {errors.moduleName && (
                <span className="text-red-500 text-sm flex items-center gap-1 dark:text-red-400">
                  <X className="w-4 h-4" />
                  {errors.moduleName.message}
                </span>
              )}
            </div>

            {/* Module Duration */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Module Duration (hours) *
              </label>
              <input
                type="number"
                {...register("moduleDuration", {
                  required: "Duration is required",
                  min: { value: 1, message: "Minimum 1 hour required" },
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-colors dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
                placeholder="Enter duration in hours"
              />
              {errors.moduleDuration && (
                <span className="text-red-500 text-sm flex items-center gap-1 dark:text-red-400">
                  <X className="w-4 h-4" />
                  {errors.moduleDuration.message}
                </span>
              )}
            </div>

            {/* Assessment Criteria */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <ClipboardList className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Assessment Criteria *
              </label>
              <input
                {...register("assessmentCriteria", {
                  required: "Assessment criteria is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-colors dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
                placeholder="Enter assessment criteria"
              />
              {errors.assessmentCriteria && (
                <span className="text-red-500 text-sm flex items-center gap-1 dark:text-red-400">
                  <X className="w-4 h-4" />
                  {errors.assessmentCriteria.message}
                </span>
              )}
            </div>

            {/* Module Description */}
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Module Description *
              </label>
              <textarea
                {...register("moduleDescription", {
                  required: "Description is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-colors dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
                rows="3"
                placeholder="Enter module description"
              />
              {errors.moduleDescription && (
                <span className="text-red-500 text-sm flex items-center gap-1 dark:text-red-400">
                  <X className="w-4 h-4" />
                  {errors.moduleDescription.message}
                </span>
              )}
            </div>

            {/* Learning Outcome */}
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Learning Outcome *
              </label>
              <textarea
                {...register("learningOutcome", {
                  required: "Learning outcome is required",
                })}
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-colors dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
                rows="2"
                placeholder="Enter learning outcomes"
              />
              {errors.learningOutcome && (
                <span className="text-red-500 text-sm flex items-center gap-1 dark:text-red-400">
                  <X className="w-4 h-4" />
                  {errors.learningOutcome.message}
                </span>
              )}
            </div>

            {/* Module Evaluations */}
            {isPractical && (
              <div className="md:col-span-2 space-y-2 relative">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
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
                          className="flex-1 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-colors dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
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
                          className="w-20 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-colors dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
                        />
                      </div>
                    ))
                  ) : (
                    // If no evaluation points yet, display a readOnly textarea.
                    <p className="text-gray-600 dark:text-gray-400">
                      No Evaluation Points Found
                    </p>
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
                    className="mt-2 flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors h-fit dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <FaMagic className="w-4 h-4" />
                    {loadingEval
                      ? "Generating..."
                      : "Generate Evaluation Points"}
                  </button>
                </div>

                {errors.evalutionPoints && (
                  <span className="text-red-500 text-sm flex items-center gap-1 dark:text-red-400">
                    <X className="w-4 h-4" />
                    {errors.evalutionPoints.message}
                  </span>
                )}

                {errorEval && (
                  <span className="text-red-500 text-sm flex items-center gap-1 dark:text-red-400">
                    <X className="w-4 h-4" />
                    {errorEval}
                  </span>
                )}
              </div>
            )}

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 text-gray-500" />
              Generated Paper:
            </label>

            {/* Display the generated Paper ID if available */}
            {assessmentPaperId && (
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated Paper ID:
                </label>
                <p className="p-2 bg-gray-100 rounded-sm dark:bg-gray-800 dark:text-gray-200 dark:border dark:border-gray-700">
                  {assessmentPaperId}
                </p>
              </div>
            )}
          </div>

          {paperData && paperData.paperId !== assessmentPaperId && (
            <PaperGeneratedNotification
              paperId={paperData.paperId}
              setShowPaperModal={setShowPaperModal}
              saveNewPaper={saveNewPaper}
            />
          )}

          <div className="flex gap-5">
            <button
              title={
                assessmentPaperId
                  ? "Generate new will delete old paper"
                  : "AI generate new Paper"
              }
              type="button"
              onClick={createNewPaper}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <FaMagic className="w-4 h-4" />
              {isLoading
                ? "Generating..."
                : assessmentPaperId
                ? "Generate New"
                : "Generate"}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Upload Images:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images && images.length > 0 ? (
              images.map((image, index) => (
                <div key={index} className="relative group">
                  <div
                    className={`${
                      isDeleting[image.id]
                        ? "animate-pulse border-2 border-red-700"
                        : "animate-none"
                    } aspect-square rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center dark:bg-gray-800 dark:border-gray-700`}
                  >
                    <IKImage
                      urlEndpoint="https://ik.imagekit.io/71amgqe4f"
                      path={image?.url.split("/").slice(-2).join("/")}
                      transformation={[
                        { height: 300, width: 300, cropMode: "pad_resize" },
                      ]}
                      lqip={{ active: true }}
                      className="object-cover w-full h-full"
                      alt={image?.name}
                      onError={(e) => console.log("error", e)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteImage({ fileId: image.id });
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity dark:bg-gray-700 dark:text-red-400"
                    title="Delete Image"
                  >
                    <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full mt-6 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-500 text-center dark:text-gray-400">
                  No images uploaded yet. Click the upload button to add images.
                </p>
              </div>
            )}
          </div>

          <ImageUploader
            setValue={setValue}
            getValues={getValues}
            setImages={setImages}
            images={images}
            fileName={moduleId || "image"}
            folderName={trade.tradeName
              .split(" ")
              .map((i) => i[0])
              .join("")}
            handleAddModules={handleAddModules}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-700">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setShow(false)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            {/* Save Module Button */}
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Save className="w-4 h-4" />
              Save Module
            </button>
          </div>
        </form>
      </div>

      {/* Modal to show generated paper preview */}
      {showPaperModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pt-10 overflow-hidden dark:bg-gray-900">
          {/* Modal overlay */}
          <div
            className="absolute inset-0 bg-black opacity-50 dark:bg-opacity-70"
            onClick={() => setShowPaperModal(false)}
          ></div>
          {/* Modal content */}
          <div className="relative bg-white rounded-lg shadow-lg z-50 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border dark:border-gray-700">
            {/* Close button */}
            <button
              onClick={() => setShowPaperModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 dark:text-gray-200">
              Generated Paper Preview
            </h2>
            {paperData ? (
              <PaperPreview paperData={paperData} setPaperData={setPaperData} />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No paper data available.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-4">
              {/* Close button */}
              <button
                onClick={() => setShowPaperModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Close
              </button>
              {/* Save Paper button */}
              <button
                type="button"
                onClick={saveNewPaper}
                className="px-4 py-2 bg-teal-600 text-white rounded-sm hover:bg-teal-700 transition-colors dark:bg-teal-500 dark:hover:bg-teal-600"
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
