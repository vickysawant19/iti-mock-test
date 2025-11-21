import React, { useEffect, useState } from "react";
import { Functions, Query } from "appwrite";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import tradeservice from "@/appwrite/tradedetails";
import conf from "@/config/config";
import { appwriteService } from "@/appwrite/appwriteConfig";

import {
  ChevronDown,
  BookOpen,
  School,
  Calendar,
  List,
  Loader2,
  Clock,
} from "lucide-react";
import subjectService from "@/appwrite/subjectService";
import moduleServices from "@/appwrite/moduleServices";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import quesdbservice from "@/appwrite/database";

const Select = ({ label, error, icon: Icon, register, ...props }) => (
  <div className="space-y-2">
    {/* Label */}
    <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
      {Icon && <Icon className="h-4 w-4 text-gray-700 dark:text-gray-300" />}
      {label}
    </label>

    {/* Select Input */}
    <select
      {...register}
      {...props}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100
        ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300"}`}
    >
      {props.children}
    </select>

    {/* Error Message */}
    {error && (
      <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>
    )}
  </div>
);

const Checkbox = ({ checked, onChange, label, className = "" }) => (
  <div
    onClick={() => onChange(!checked)}
    className={`flex items-center space-x-2 cursor-pointer ${className}`}
  >
    {/* Checkbox Box */}
    <div
      className={`w-4 h-4 border rounded flex items-center justify-center ${
        checked
          ? "bg-blue-500 border-blue-500"
          : "border-gray-300 dark:border-gray-600"
      }`}
    >
      {checked && (
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </div>

    {/* Label */}
    <span className="text-sm text-gray-900 dark:text-gray-100">{label}</span>
  </div>
);

const CreateMockTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trades, setTrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const [modules, setModules] = useState(null);
  const [isModulesOpen, setIsModulesOpen] = useState(true);

  const [searchTags, setSearchTags] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchTags.trim()) {
        setIsLoading(true);
        try {
          const response = await quesdbservice.getAllTags(searchTags);
          setTags(response.slice(0, 5));
        } catch (error) {
          console.error("Error fetching tags:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setTags([]);
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [searchTags]);

  const handleTagSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setSearchTags("");
    setTags([]);
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      tradeId: "",
      year: "",
      subjectId: "",
      selectedModules: [],
      quesCount: "",
    },
  });

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const navigate = useNavigate();

  const tradeId = useWatch({ control, name: "tradeId" });
  const subjectId = useWatch({ control, name: "subjectId" });
  const year = useWatch({ control, name: "year" });

  const fetchTrades = async () => {
    try {
      const resp = await tradeservice.listTrades();
      setTrades(resp.documents);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const resp = await subjectService.listSubjects();
      setSubjects(resp.documents);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchModules = async () => {
    if (!tradeId || !subjectId || !year) return;
    try {
      const response = await moduleServices.getNewModulesData(
        tradeId,
        subjectId,
        year
      );

      setModules(
        response.sort(
          (a, b) => a.moduleId.match(/\d+/)?.[0] - b.moduleId.match(/\d+/)?.[0]
        )
      );
      // Set selectedModules to all module IDs by default
      setValue(
        "selectedModules",
        response.map((module) => module.moduleId)
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch Modules");
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (tradeId && subjectId && year) {
      fetchModules();
    }
  }, [tradeId, subjectId, year]);

  useEffect(() => {
    if (!profile) return;
    if (trades.length < 0) return;
    setValue("tradeId", profile.tradeId);
    const trade = trades.find((tr) => tr.$id === profile.tradeId);
    setSelectedTrade(trade);
  }, [profile, trades]);

  useEffect(() => {
    if (!trades.length) return;
    const onTradeChange = (e) => {
      setSelectedTrade(trades.find((tr) => tr.$id === tradeId));
    };
    onTradeChange();
  }, [tradeId]);

  const handleSelectAllModules = (checked) => {
    if (checked) {
      setValue(
        "selectedModules",
        modules?.syllabus.map((module) => module.moduleId) || []
      );
    } else {
      setValue("selectedModules", []);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    data.userName = user.name;
    data.userId = user.$id;
    data.tradeName = selectedTrade.tradeName;
    data.action = "generateMockTest";
    data.tags = selectedTags;
    try {
      const functions = new Functions(appwriteService.getClient());
      const res = await functions.createExecution(
        conf.mockTestFunctionId,
        JSON.stringify(data)
      );
      const { responseBody } = res;
      if (!responseBody) {
        throw new Error("No response received from the server.");
      }
      const parsedRes = JSON.parse(responseBody);
      if (parsedRes.error) {
        throw new Error(parsedRes.error);
      }
      toast.success(`Mock test created successfully!`);
      reset();
      navigate(`/all-mock-tests`);
    } catch (error) {
      console.log(error);
      toast.error(`Error creating mock test: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8 flex justify-center items-start pt-20">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BookOpen className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            Create Mock Test
          </h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Trade"
                icon={School}
                error={errors.tradeId?.message}
                register={register("tradeId", {
                  required: "Trade is required",
                })}
                className="text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Trade</option>
                {trades.map((trade) => (
                  <option key={trade.$id} value={trade.$id}>
                    {trade.tradeName}
                  </option>
                ))}
              </Select>

              {selectedTrade && (
                <Select
                  label="Year"
                  icon={Calendar}
                  error={errors.year?.message}
                  register={register("year", {
                    required: "Year is required",
                  })}
                  className="text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Year</option>
                  {new Array(selectedTrade.duration)
                    .fill(null)
                    .map((_, index) => (
                      <option
                        key={index}
                        value={index === 0 ? "FIRST" : "SECOND"}
                      >
                        {index === 0 ? "First Year" : "Second Year"}
                      </option>
                    ))}
                </Select>
              )}

              <Select
                label="Subject"
                icon={List}
                error={errors.subjectId?.message}
                register={register("subjectId", {
                  required: "Subject is required",
                })}
                className="text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.$id} value={subject.$id}>
                    {subject.subjectName}
                  </option>
                ))}
              </Select>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Clock className="h-4 w-4 text-gray-700 dark:text-gray-300" />{" "}
                  Questions Count
                </label>
                <input
                  type="number"
                  {...register("quesCount", {
                    required: "Question count is required",
                    min: {
                      value: 10,
                      message: "Minimum 10 questions required",
                    },
                    max: {
                      value: 50,
                      message: "Maximum 50 questions allowed",
                    },
                    valueAsNumber: true,
                    validate: (value) =>
                      !isNaN(value) || "Please enter a valid number",
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                    errors.quesCount
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.quesCount && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {errors.quesCount?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Clock className="h-4 w-4 text-gray-700 dark:text-gray-300" />{" "}
                  Exam Time (Minutes)
                </label>
                <input
                  type="number"
                  {...register("totalMinutes", {
                    required: "Minutes is required",
                    min: {
                      value: 10,
                      message: "Minimum 10 Minutes required",
                    },
                    max: {
                      value: 200,
                      message: "Maximum 200 Minutes allowed",
                    },
                    valueAsNumber: true,
                    validate: (value) =>
                      !isNaN(value) || "Please enter a valid number",
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                    errors.totalMinutes
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.totalMinutes && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {errors.totalMinutes?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="relative space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-md text-sm flex items-center"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={searchTags}
                onChange={(e) => setSearchTags(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Search tags..."
              />
              {isLoading && (
                <div className="absolute right-3 top-[38px]">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              )}
              {tags.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {modules && (
              <div className="border rounded-lg dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModulesOpen(!isModulesOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Select Modules
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 text-gray-700 dark:text-gray-300 ${
                      isModulesOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                {isModulesOpen && (
                  <div className="p-4 border-t dark:border-gray-700">
                    <Controller
                      name="selectedModules"
                      control={control}
                      rules={{}}
                      render={({ field }) => (
                        <div>
                          <Checkbox
                            checked={field.value.length === modules.length}
                            onChange={handleSelectAllModules}
                            label="Select All Modules"
                            className="mb-4 text-gray-900 dark:text-gray-100"
                          />

                          <div className="max-h-64 overflow-y-auto pr-2">
                            <div className="space-y-2">
                              {modules.map((module) => (
                                <Checkbox
                                  key={module.moduleId}
                                  checked={field.value.includes(
                                    module.moduleId
                                  )}
                                  onChange={() => {
                                    const newValue = field.value.includes(
                                      module.moduleId
                                    )
                                      ? field.value.filter(
                                          (id) => id !== module.moduleId
                                        )
                                      : [...field.value, module.moduleId];
                                    field.onChange(newValue);
                                  }}
                                  label={
                                    module.moduleId + " - " + module.moduleName
                                  }
                                  className="text-gray-900 dark:text-gray-100"
                                />
                              ))}
                            </div>
                          </div>
                          {errors.selectedModules && (
                            <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                              {errors.selectedModules.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg text-white font-medium flex items-center justify-center ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  Creating...
                </>
              ) : (
                "Create Mock Test"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMockTest;
