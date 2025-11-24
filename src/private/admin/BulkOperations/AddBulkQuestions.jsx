import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import subjectService from "@/appwrite/subjectService";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { selectProfile } from "@/store/profileSlice";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check, Loader2, Upload, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import quesdbservice from "@/appwrite/database";
import moduleServices from "@/appwrite/moduleServices";

const AddBulkQuestions = () => {
  const [tradeData, setTradeData] = useState({
    data: [],
    selectedTrade: null,
  });
  const [subjectData, setSubjectData] = useState({
    data: [],
    selectedSubject: null,
  });
  const [selectedTradeYear, setSelectedTradeYear] = useState(null);
  const [modulesData, setModulesData] = useState({
    data: [],
    selectedModule: null,
  });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [jsonError, setJsonError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Prompt template that can be copied into the textarea
  const promptTemplate = `Act as a data formatting assistant. Your task is to convert the raw quiz questions provided below into a specific JSON array format.

Target JSON Structure:
[
  {
    "question": "Question Text Here",
    "correctAnswer": "A",
    "options": [
      "Option A Text",
      "Option B Text",
      "Option C Text",
      "Option D Text"
    ],
    "tags": "nimi"
  }
]

Strict Rules:
1. Merging Translations: If a question or option is provided in two languages (e.g., English on one line, Marathi on the next), you must combine them into a single string on the same line. Use a forward slash and a space to join the translations (e.g., "English text / मराठी शब्द ").
2. Tags: The "tags" field must always be set to "nimi".
3. Correct Answer: Extract only the option letter (A, B, C, or D).
4. Output: Provide only the raw JSON code. Do not wrap it in markdown code blocks and do not include conversational text.

Input Data:
Paste your raw quiz questions below.
`;

  const profile = useSelector(selectProfile);

  // Trades fetched via RTK Query (useListTradesQuery)
  const { data: tradesResponse, isLoading: tradesLoading } = useListTradesQuery(
    undefined,
    { skip: !profile }
  );
  const trades = tradesResponse?.documents || [];
  const isFetching = fetchingData || tradesLoading;

  const fetchSubjects = async () => {
    setFetchingData(true);
    try {
      const data = await subjectService.listSubjects();
      setSubjectData({ data: data.documents || [], selectedSubject: null });
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjectData({ data: [], selectedSubject: null });
    } finally {
      setFetchingData(false);
    }
  };

  const fetchModules = async () => {
    if (
      !tradeData.selectedTrade ||
      !subjectData.selectedSubject ||
      !selectedTradeYear
    ) {
      return;
    }

    try {
      setLoading(true);

      const syllabusData = await moduleServices.getNewModulesData(
        tradeData.selectedTrade.$id,
        subjectData.selectedSubject.$id,
        selectedTradeYear
      );

      const sortedSyllabusData = syllabusData.sort(
        (a, b) => a.moduleId.match(/\d+/)[0] - b.moduleId.match(/\d+/)[0]
      );

      setModulesData({
        data: sortedSyllabusData,
        selectedModule: null,
      });
    } catch (error) {
      console.error("Error fetching modules:", error);
      setModulesData({ data: [], selectedModule: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchSubjects();
    }
  }, [profile]);

  useEffect(() => {
    // Reset modules when any selection changes
    setModulesData({ data: [], selectedModule: null });

    if (
      tradeData.selectedTrade &&
      subjectData.selectedSubject &&
      selectedTradeYear
    ) {
      fetchModules();
    }
  }, [tradeData.selectedTrade, subjectData.selectedSubject, selectedTradeYear]);

  const handleJsonInput = (value) => {
    setJsonInput(value);
    setJsonError("");

    if (!value.trim()) {
      setParsedQuestions([]);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      const questionsArray = Array.isArray(parsed) ? parsed : [parsed];

      // Validate question structure
      const isValid = questionsArray.every(
        (q) =>
          q.question &&
          q.correctAnswer &&
          Array.isArray(q.options) &&
          q.options.length >= 2
      );

      if (!isValid) {
        setJsonError(
          "Invalid question structure. Each question must have: question, correctAnswer, and options array"
        );
        setParsedQuestions([]);
        return;
      }

      setParsedQuestions(questionsArray);
    } catch (error) {
      setJsonError("Invalid JSON format: " + error.message);
      setParsedQuestions([]);
    }
  };

  const handleSubmit = async () => {
    if (
      !tradeData.selectedTrade ||
      !subjectData.selectedSubject ||
      !selectedTradeYear ||
      !modulesData.selectedModule
    ) {
      alert("Please select all required fields");
      return;
    }

    if (parsedQuestions.length === 0) {
      alert("Please provide valid questions JSON");
      return;
    }

    if (!profile?.userId || !profile?.userName) {
      alert("User profile not available");
      return;
    }

    setSubmitting(true);
    setSubmitStatus(null);

    try {
      const enrichedQuestions = parsedQuestions.map((q) => ({
        ...q,
        tradeId: tradeData.selectedTrade.$id,
        subjectId: subjectData.selectedSubject.$id,
        year: selectedTradeYear,
        moduleId: modulesData.selectedModule.moduleId,
        userId: profile.userId,
        userName: profile.userName,
      }));

      const payload = {
        action: "bulkaddQuestions",
        questions: enrichedQuestions,
      };
      console.log("Submitting payload:", payload);
      const response = await quesdbservice.bulkaddQuestions(
        JSON.stringify(payload)
      );
      setSubmitStatus("success");
      toast.success(
        `${parsedQuestions.length} question${
          parsedQuestions.length !== 1 ? "s" : ""
        } submitted successfully!`
      );
      setJsonInput("");
      setParsedQuestions([]);
    } catch (error) {
      console.error("Error submitting questions:", error);
      setSubmitStatus("error");
      toast.error("Failed to submit questions. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Add Bulk Questions
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Select criteria and paste JSON questions to add them in bulk
          </p>
        </div>

        {/* Selection Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Criteria
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Trade Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade <span className="text-red-500">*</span>
              </label>
              <Select.Root
                value={tradeData.selectedTrade?.$id || ""}
                onValueChange={(value) => {
                  const trade = trades.find((t) => t.$id === value);
                  setTradeData((prev) => ({ ...prev, selectedTrade: trade }));
                }}
                disabled={isFetching || trades.length === 0}
              >
                <Select.Trigger className="w-full inline-flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Select.Value
                    placeholder={
                      trades.length === 0
                        ? "No trades available"
                        : "Select trade"
                    }
                  />
                  <Select.Icon>
                    <ChevronDown className="w-4 h-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <Select.Viewport className="p-1">
                      {trades.map((trade) => (
                        <Select.Item
                          key={trade.$id}
                          value={trade.$id}
                          className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none"
                        >
                          <Select.ItemText>
                            {trade.tradeName || trade.name}
                          </Select.ItemText>
                          <Select.ItemIndicator className="absolute left-2">
                            <Check className="w-4 h-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Subject Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <Select.Root
                value={subjectData.selectedSubject?.$id || ""}
                onValueChange={(value) => {
                  const subject = subjectData.data.find((s) => s.$id === value);
                  setSubjectData((prev) => ({
                    ...prev,
                    selectedSubject: subject,
                  }));
                }}
                disabled={isFetching || subjectData.data.length === 0}
              >
                <Select.Trigger className="w-full inline-flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Select.Value
                    placeholder={
                      subjectData.data.length === 0
                        ? "No subjects available"
                        : "Select subject"
                    }
                  />
                  <Select.Icon>
                    <ChevronDown className="w-4 h-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <Select.Viewport className="p-1">
                      {subjectData.data.map((subject) => (
                        <Select.Item
                          key={subject.$id}
                          value={subject.$id}
                          className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none"
                        >
                          <Select.ItemText>
                            {subject.subjectName || subject.name}
                          </Select.ItemText>
                          <Select.ItemIndicator className="absolute left-2">
                            <Check className="w-4 h-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Year Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <Select.Root
                value={selectedTradeYear || ""}
                onValueChange={setSelectedTradeYear}
              >
                <Select.Trigger className="w-full inline-flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <Select.Value placeholder="Select year" />
                  <Select.Icon>
                    <ChevronDown className="w-4 h-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="FIRST"
                        className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none"
                      >
                        <Select.ItemText>First Year</Select.ItemText>
                        <Select.ItemIndicator className="absolute left-2">
                          <Check className="w-4 h-4" />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item
                        value="SECOND"
                        className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none"
                      >
                        <Select.ItemText>Second Year</Select.ItemText>
                        <Select.ItemIndicator className="absolute left-2">
                          <Check className="w-4 h-4" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Module Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module <span className="text-red-500">*</span>
              </label>
              <Select.Root
                value={modulesData.selectedModule?.moduleId || ""}
                onValueChange={(value) => {
                  const module = modulesData.data.find(
                    (m) => m.moduleId === value
                  );
                  setModulesData((prev) => ({
                    ...prev,
                    selectedModule: module,
                  }));
                }}
                disabled={loading || modulesData.data.length === 0}
              >
                <Select.Trigger className="w-full inline-flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Select.Value
                    placeholder={
                      loading
                        ? "Loading..."
                        : modulesData.data.length === 0
                        ? "Select criteria first"
                        : "Select module"
                    }
                  />
                  <Select.Icon>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <Select.Viewport className="p-1">
                      {modulesData.data.map((module) => (
                        <Select.Item
                          key={module.moduleId}
                          value={module.moduleId}
                          className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none"
                        >
                          <Select.ItemText>
                            {module.moduleId} - {module.moduleName}
                          </Select.ItemText>
                          <Select.ItemIndicator className="absolute left-2">
                            <Check className="w-4 h-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              {modulesData.data.length === 0 &&
                !loading &&
                tradeData.selectedTrade &&
                subjectData.selectedSubject &&
                selectedTradeYear && (
                  <p className="mt-1 text-xs text-amber-600">
                    No modules found for selected criteria
                  </p>
                )}
            </div>
          </div>

          {/* Selected Summary */}
          {(tradeData.selectedTrade ||
            subjectData.selectedSubject ||
            selectedTradeYear ||
            modulesData.selectedModule) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Selected Criteria
                  </p>
                  <div className="text-sm text-blue-800 space-y-1">
                    {tradeData.selectedTrade && (
                      <p>
                        <span className="font-medium">Trade:</span>{" "}
                        {tradeData.selectedTrade.tradeName ||
                          tradeData.selectedTrade.name}
                      </p>
                    )}
                    {subjectData.selectedSubject && (
                      <p>
                        <span className="font-medium">Subject:</span>{" "}
                        {subjectData.selectedSubject.subjectName ||
                          subjectData.selectedSubject.name}
                      </p>
                    )}
                    {selectedTradeYear && (
                      <p>
                        <span className="font-medium">Year:</span>{" "}
                        {selectedTradeYear === "FIRST"
                          ? "First Year"
                          : "Second Year"}
                      </p>
                    )}
                    {modulesData.selectedModule && (
                      <p>
                        <span className="font-medium">Module:</span>{" "}
                        {modulesData.selectedModule.moduleId} -{" "}
                        {modulesData.selectedModule.moduleName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* JSON Input */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Questions JSON
          </h2>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Paste your questions JSON here
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(promptTemplate);
                    toast.success("Prompt copied to clipboard");
                  } catch (err) {
                    console.error("Clipboard write failed", err);
                    toast.error("Failed to copy prompt to clipboard");
                  }
                }}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                aria-label="Copy prompt"
              >
                Copy Prompt
              </button>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => handleJsonInput(e.target.value)}
              placeholder='[{"question": "Your question?", "correctAnswer": "A", "options": ["Option A", "Option B", "Option C", "Option D"], "tags": "nimi"}]'
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            {jsonError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{jsonError}</p>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Format: Array of question objects. Each must have: question,
              correctAnswer, options (array), and optional tags.
            </p>
          </div>

          {parsedQuestions.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">
                  Preview ({parsedQuestions.length} question
                  {parsedQuestions.length !== 1 ? "s" : ""})
                </p>
                <button
                  onClick={() => {
                    setJsonInput("");
                    setParsedQuestions([]);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-start">
                      <span className="shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-3">
                          {q.question}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          {q.options?.map((opt, optIdx) => {
                            const optionLetter = String.fromCharCode(
                              65 + optIdx
                            );
                            const isCorrect = q.correctAnswer === optionLetter;
                            return (
                              <div
                                key={optIdx}
                                className={`px-3 py-2 rounded text-sm ${
                                  isCorrect
                                    ? "bg-green-50 border border-green-200 text-green-800 font-medium"
                                    : "bg-gray-50 border border-gray-200 text-gray-700"
                                }`}
                              >
                                <span className="font-semibold">
                                  {optionLetter}.
                                </span>{" "}
                                {opt}
                                {isCorrect && (
                                  <span className="ml-2 text-xs">✓</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            Correct:{" "}
                            <span className="font-medium text-gray-700">
                              {q.correctAnswer}
                            </span>
                          </span>
                          {q.tags && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Tags:{" "}
                              <span className="font-medium text-gray-700">
                                {q.tags}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              parsedQuestions.length === 0 ||
              !tradeData.selectedTrade ||
              !subjectData.selectedSubject ||
              !selectedTradeYear ||
              !modulesData.selectedModule
            }
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting {parsedQuestions.length} question
                {parsedQuestions.length !== 1 ? "s" : ""}...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Submit {parsedQuestions.length} Question
                {parsedQuestions.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBulkQuestions;
