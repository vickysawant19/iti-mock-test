import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store/userSlice";
import { selectProfile } from "../../../store/profileSlice";
import tradeservice from "../../../appwrite/tradedetails";
import subjectService from "../../../appwrite/subjectService";
import moduleServices from "../../../appwrite/moduleServices";
import { Query } from "appwrite";
import { useForm } from "react-hook-form";
import {
  Book,
  Clock,
  Target,
  Link,
  CheckSquare,
  Trash,
  Edit,
  Plus,
} from "lucide-react";

const AddModules = () => {
  const [tradeData, setTradeData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [selectedTradeID, setSelectedTradeID] = useState("");
  const [selectedSubjectID, setSelectedSubjectID] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const fetchTrades = async () => {
    try {
      const data = await tradeservice.listTrades();
      setTradeData(data.documents);
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.listSubjects();
      setSubjectData(data.documents);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const data = await moduleServices.listModules([
        Query.equal("tradeId", selectedTradeID),
        Query.equal("subjectId", selectedSubjectID),
      ]);
      setModules(data.documents);
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchTrades();
      fetchSubjects();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedTradeID && selectedSubjectID) {
      fetchModules();
    }
  }, [selectedTradeID, selectedSubjectID]);

  const onSubmit = async (formData) => {
    try {
      const newModule = {
        tradeId: selectedTradeID,
        subjectId: selectedSubjectID,
        syllabus: [
          { 
            moduleId: formData.moduleId, 
            moduleName: "",
            moduleDuration: parseInt(formData.moduleDuration),
            learningOutcome: "",
            moduleDescription: "",
            hours: parseInt(formData.sectionHours),
            topics: [
              { 
                topicId: formData.topicId,
                topicName: formData.topicName,
                hours: parseInt(formData.topicHours),
                resources: [formData.topicResource],
                assessment: formData.topicAssessment,
              },
            ],
          },
        ],
      };

      console.log(newModule)

      // await moduleServices.createModules(newModule);
      // await fetchModules();
      // setShowForm(false);
      // reset();
    } catch (error) {
      console.error("Error creating module:", error);
    }
  };

  const handleDelete = async (moduleId) => {
    try {
      await moduleServices.deleteModules(moduleId);
      setModules(modules.filter((module) => module.$id !== moduleId));
    } catch (error) {
      console.error("Error deleting module:", error);
    }
  };

  const getTradeName = (tradeId) => {
    return tradeData.find((trade) => trade.$id === tradeId)?.tradeName || "";
  };

  const getSubjectName = (subjectId) => {
    return (
      subjectData.find((subject) => subject.$id === subjectId)?.subjectName ||
      ""
    );
  };

  return (
    <div className="bg-white p-3">
      <header className="bg-blue-600 text-white py-6 mb-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-center">
              Module Management System
            </h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Module
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4">
      {/* Select the trade and subject to get module */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Trade</label>
            <select
              value={selectedTradeID}
              onChange={(e) => setSelectedTradeID(e.target.value)}
              className="w-full p-2 border rounded-lg bg-gray-50"
            >
              <option value="">Select Trade</option>
              {tradeData.map((trade) => (
                <option key={trade.$id} value={trade.$id}>
                  {trade.tradeName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Subject</label>
            <select
              value={selectedSubjectID}
              onChange={(e) => setSelectedSubjectID(e.target.value)}
              className="w-full p-2 border rounded-lg bg-gray-50"
              disabled={!selectedTradeID}
            >
              <option value="">Select Subject</option>
              {subjectData.map((subject) => (
                <option key={subject.$id} value={subject.$id}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-6">Create New Module</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Trade Name
                  </label>
                  <input
                    value={getTradeName(selectedTradeID)}
                    readOnly
                    className="w-full p-2 border rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subject Name
                  </label>
                  <input
                    value={getSubjectName(selectedSubjectID)}
                    readOnly
                    className="w-full p-2 border rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Module Name *
                  </label>
                  <input
                    {...register("moduleName", { required: "Required field" })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {errors.moduleName && (
                    <span className="text-red-500 text-sm">
                      {errors.moduleName.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Module Duration (hours) *
                  </label>
                  <input
                    type="number"
                    {...register("moduleDuration", {
                      required: "Required field",
                      min: { value: 1, message: "Minimum 1 hour" },
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {errors.moduleDuration && (
                    <span className="text-red-500 text-sm">
                      {errors.moduleDuration.message}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Module Description *
                </label>
                <textarea
                  {...register("moduleDescription", {
                    required: "Required field",
                  })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                />
                {errors.moduleDescription && (
                  <span className="text-red-500 text-sm">
                    {errors.moduleDescription.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Learning Outcome *
                  </label>
                  <textarea
                    {...register("learningOutcome", {
                      required: "Required field",
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="2"
                  />
                  {errors.learningOutcome && (
                    <span className="text-red-500 text-sm">
                      {errors.learningOutcome.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Assessment Criteria *
                  </label>
                  <input
                    {...register("assessmentCriteria", {
                      required: "Required field",
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {errors.assessmentCriteria && (
                    <span className="text-red-500 text-sm">
                      {errors.assessmentCriteria.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Section Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Section Heading *
                    </label>
                    <input
                      {...register("sectionHeading", {
                        required: "Required field",
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.sectionHeading && (
                      <span className="text-red-500 text-sm">
                        {errors.sectionHeading.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Section Hours *
                    </label>
                    <input
                      type="number"
                      {...register("sectionHours", {
                        required: "Required field",
                        min: { value: 1, message: "Minimum 1 hour" },
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.sectionHours && (
                      <span className="text-red-500 text-sm">
                        {errors.sectionHours.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Topic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Topic Name *
                    </label>
                    <input
                      {...register("topicName", { required: "Required field" })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.topicName && (
                      <span className="text-red-500 text-sm">
                        {errors.topicName.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Topic Hours *
                    </label>
                    <input
                      type="number"
                      {...register("topicHours", {
                        required: "Required field",
                        min: { value: 1, message: "Minimum 1 hour" },
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.topicHours && (
                      <span className="text-red-500 text-sm">
                        {errors.topicHours.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Topic Type *
                    </label>
                    <select
                      {...register("topicType", { required: "Required field" })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Type</option>
                      <option value="Theory">Theory</option>
                      <option value="Practical">Practical</option>
                    </select>
                    {errors.topicType && (
                      <span className="text-red-500 text-sm">
                        {errors.topicType.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Topic Resource *
                    </label>
                    <input
                      {...register("topicResource", {
                        required: "Required field",
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.topicResource && (
                      <span className="text-red-500 text-sm">
                        {errors.topicResource.message}
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Topic Assessment *
                    </label>
                    <textarea
                      {...register("topicAssessment", {
                        required: "Required field",
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      rows="2"
                    />
                    {errors.topicAssessment && (
                      <span className="text-red-500 text-sm">
                        {errors.topicAssessment.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">Loading modules...</div>
        ) : modules.length > 0 ? (
          modules.map((module) => (
            <div
              key={module.$id}
              className="bg-white rounded-lg shadow-lg mb-6"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{module.moduleName}</h2>
                    <p className="text-gray-600">
                      {getTradeName(module.tradeId)} -{" "}
                      {getSubjectName(module.subjectId)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(module.$id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Duration:</span>{" "}
                      {module.moduleDuration} hours
                    </p>
                    <p className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">
                        Learning Outcome:
                      </span>{" "}
                      {module.learningOutcome}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 mb-2">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Assessment:</span>{" "}
                      {module.assessmentCriteria}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {module.syllabus?.map((section) => (
                    <div key={section.heading} className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-semibold mb-4">
                        {section.heading} ({section.hours} hours)
                      </h3>
                      <div className="space-y-4">
                        {section.topics?.map((topic) => (
                          <div
                            key={topic.topic}
                            className="bg-gray-50 p-4 rounded-lg"
                          >
                            <h4 className="font-medium mb-2">{topic.topic}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <p className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                Duration: {topic.hours} hours
                              </p>
                              <p className="flex items-center gap-2">
                                <Book className="w-4 h-4 text-blue-600" />
                                Type: {topic.topicType}
                              </p>
                              <p className="flex items-center gap-2">
                                <Link className="w-4 h-4 text-blue-600" />
                                Resources: {topic.resources?.length}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};


export default AddModules