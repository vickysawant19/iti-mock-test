import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../store/profileSlice";
import { PlusCircle, BookOpen, Filter, ChevronRight, Copy, Wand2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

import ModulesList from "./ModulesList";
import AddTopics from "./AddTopics";
import AddModules from "./AddModules";
import ShowModules from "./ShowModules";
import ShowTopic from "./ShowTopic";

import { useListTradesQuery } from "@/store/api/tradeApi";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { Query } from "appwrite";
import subjectService from "@/appwrite/subjectService";
import moduleServices from "@/appwrite/moduleServices";
import useModuleTestGenerator from "./module-assignment/ModuleTestGenerator";
import useScrollToItem from "@/hooks/useScrollToItem";

const Modules = () => {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [subjectData, setSubjectData] = useState([]);
  const [selectedTradeID, setSelectedTradeID] = useState("");
  const [selectedSubjectID, setSelectedSubjectID] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTradeYear, setSelectedTradeYear] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [moduleId, setModuleId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [newModules, setNewModules] = useState([]);
  const [show, setShow] = useState(new Set());
  const [showModulesList, setShowModulesList] = useState(true);
  
  // Prompt Modal States
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [startingNumber, setStartingNumber] = useState("1");
  const [syllabusText, setSyllabusText] = useState("");

  const profile = useSelector(selectProfile);

  const moduleTest = useModuleTestGenerator({
    tradeId: selectedTrade?.$id,
    tradeName: selectedTrade?.tradeName || "-",
    year: selectedTradeYear,
    userId: profile.userId,
    userName: profile.userName,
  });

  const isPractical =
    selectedSubject &&
    selectedSubject.subjectName.toUpperCase().includes("PRACTICAL");

  const { scrollToItem, itemRefs } = useScrollToItem(
    newModules || [],
    "moduleId"
  );

  const { data: collegesResponse } = useListCollegesQuery();
  const collegeData = collegesResponse?.documents || [];

  const isAdmin = profile?.role?.includes("admin") || false; 
  const userCollege = collegeData.find(c => c.$id === profile?.collegeId);
  const tradeIds = userCollege?.tradeIds || [];

  // Use RTK Query to fetch trades; skip until profile is available
  // Filter by college tradeIds unless it's an admin
  const { data: tradesResponse, isLoading: tradesLoading } = useListTradesQuery(
    isAdmin || !tradeIds.length ? undefined : [Query.equal("$id", tradeIds)],
    { skip: !profile }
  );
  const tradeData = tradesResponse?.documents || [];

  const fetchSubjects = async () => {
    setFetchingData(true);
    try {
      const data = await subjectService.listSubjects();
      setSubjectData(data.documents);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setFetchingData(false);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const newModulesData = await moduleServices.getNewModulesData(
        selectedTradeID,
        selectedSubjectID,
        selectedTradeYear
      );

      setNewModules(newModulesData);
      setShow(new Set());
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchSubjects();
    }
  }, [profile]);

  const isFetching = fetchingData || tradesLoading;

  const handleCopyPrompt = async () => {
    const subjectName = selectedSubject?.subjectName || "the specified subject";
    const subjectType = isPractical ? "Professional Skills (Trade Practical)" : "Professional Knowledge (Trade Theory)";
    const moduleIdPrefix = isPractical ? "P" : "M";
    const itemType = isPractical ? "practical task" : "theory topic";

    let evaluationCriteriaSection = "";
    let markdownHeaders = "| moduleId | moduleName | moduleDuration | moduleDescription | learningOutcome |";

    let markdownRow = `| ${selectedTradeID} | ${selectedSubjectID} | ${selectedTradeYear} | ${moduleIdPrefix}1 | [Name Without Number] | [Int] | [Generated Desc] | [Extracted Outcome] |`;

    if (isPractical) {
      evaluationCriteriaSection = `assessmentCriteria: Extract the exact text from the corresponding "Assessment Criteria" mapped to this ${itemType}.
evalutionsPoints[]: Generate exactly 5 unique evaluation criteria specifically tailored to the ${itemType} (e.g., evaluate joint quality, logic, safety, etc). Each criteria is worth 20 points. Format this strictly as a stringified JSON array:
["{\\"id\\":1,\\"evaluation\\":\\"[Criterion 1]\\",\\"points\\":\\"20\\"}","{\\"id\\":2,\\"evaluation\\":\\"[Criterion 2]\\",\\"points\\":\\"20\\"}","{\\"id\\":3,\\"evaluation\\":\\"[Criterion 3]\\",\\"points\\":\\"20\\"}","{\\"id\\":4,\\"evaluation\\":\\"[Criterion 4]\\",\\"points\\":\\"20\\"}","{\\"id\\":5,\\"evaluation\\":\\"[Criterion 5]\\",\\"points\\":\\"20\\"}"]`;
      markdownHeaders += " assessmentCriteria | evalutionsPoints[] |";
      markdownRow += ` [Extracted Criteria] | ["{\\"id\\":1,\\"evaluation\\":\\"...\\",\\"points\\":\\"20\\"}",...] |`;
    } else {
      evaluationCriteriaSection = `assessmentCriteria: Output "NA" as this is a theory subject.
evalutionsPoints[]: Output "[]" (an empty JSON array) as this is a theory subject.`;
      markdownHeaders += " assessmentCriteria | evalutionsPoints[] |";
      markdownRow += ` NA | [] |`;
    }

    const prompt = `System Role & Task:
You are an expert curriculum mapping engineer. I will provide you with text from an industrial/vocational training syllabus.
Your task is to parse the "${subjectType}" items for the subject "${subjectName}" and convert them into a structured Markdown table mapping to my database schema.

Strict Output Rules:
- Output ONLY the Markdown table.
- Do NOT include any introductory greetings, conversational filler, or concluding remarks.
- Retain all technical formatting and comments.

Input Data:
Syllabus Text:
${syllabusText || "[INSERT YOUR COPIED SYLLABUS TEXT HERE - Include Learning Outcomes, Skills/Knowledge, and Assessment Criteria]"}

Static Schema Variables:
assessmentPaperId: ""
images[]: "[]"
topics[]: "[]"
hours: 0

Column Mapping & Generation Logic for the Markdown Table:
Please generate a Markdown table with the following columns, applying the logic below for every ${itemType} identified in the syllabus:
moduleId: Extract the explicit integer number assigned to the ${itemType} in the syllabus, and prefix it exactly with '${moduleIdPrefix}' (e.g., if the syllabus lists "1. [Task]", the moduleId MUST be '${moduleIdPrefix}1'; if it lists "14. [Task]", it MUST be '${moduleIdPrefix}14'). Do NOT auto-increment your own sequence; strictly use the native syllabus numbers!
moduleName: Extract the exact ${itemType} name EXACTLY as it appears in the "${subjectType}" section. Strip away the numeric prefix so it contains pure text.
moduleDuration: Extract the allocated hours for the specific block. If hours are grouped, distribute them logically as integers.
moduleDescription: Generate a 1-2 sentence technical summary explaining what the ${itemType} achieves.
learningOutcome: Extract the exact text from the corresponding "Learning Outcome" mapped to this item.
tradeId: Output exactly "${selectedTradeID}" for all rows.
subjectId: Output exactly "${selectedSubjectID}" for all rows.
year: Output exactly "${selectedTradeYear}" for all rows.
${evaluationCriteriaSection}

Markdown Table Format Example:
| tradeId | subjectId | year ${markdownHeaders}
|---|---|---|${isPractical ? "---|---|" : "---|---|" }
${markdownRow}`;

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("AI Prompt customized and copied!");
      setShowPromptModal(false);
    } catch (err) {
      console.error("Failed to copy", err);
      toast.error("Failed to copy prompt");
    }
  };

  useEffect(() => {
    if (selectedTradeID && selectedSubjectID) {
      fetchModules();
    }
  }, [selectedTradeID, selectedTradeYear, selectedSubjectID]);

  useEffect(() => {
    if (selectedTradeID) {
      setSelectedTrade(tradeData.find((item) => item.$id === selectedTradeID));
    }
  }, [selectedTradeID]);

  const hasActiveView = show.size > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Module Manager</h1>
          </div>
        </div>
      </header>

      {/* Mobile Filters */}
      <div className="lg:hidden border-b bg-background ">
        <div className="container px-4 py-4 space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-primary" />
              Trade
            </Label>
            <Select
              value={selectedTradeID}
              onValueChange={setSelectedTradeID}
              disabled={isFetching}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Trade" />
              </SelectTrigger>
              <SelectContent>
                {tradeData.map((trade) => (
                  <SelectItem key={trade.$id} value={trade.$id}>
                    {trade.tradeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-primary" />
              Year
            </Label>
            <Select
              value={selectedTradeYear}
              onValueChange={setSelectedTradeYear}
              disabled={isFetching}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {selectedTradeID &&
                  Array.from({
                    length:
                      tradeData.find((trade) => trade.$id === selectedTradeID)
                        ?.duration || 0,
                  }).map((_, idx) => (
                    <SelectItem
                      key={idx}
                      value={idx === 0 ? "FIRST" : "SECOND"}
                    >
                      {idx === 0 ? "FIRST" : "SECOND"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-primary" />
              Subject
            </Label>
            <Select
              value={selectedSubjectID}
              onValueChange={(value) => {
                setSelectedSubject(
                  subjectData.find((item) => item.$id === value)
                );
                setSelectedSubjectID(value);
              }}
              disabled={!selectedTradeID || isFetching}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectData.map((subject) => (
                  <SelectItem key={subject.$id} value={subject.$id}>
                    {subject.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block sticky top-16 z-30 mx-auto  border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Trade
              </Label>
              <Select
                value={selectedTradeID}
                onValueChange={setSelectedTradeID}
                disabled={isFetching}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Trade" />
                </SelectTrigger>
                <SelectContent>
                  {tradeData.map((trade) => (
                    <SelectItem key={trade.$id} value={trade.$id}>
                      {trade.tradeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Year
              </Label>
              <Select
                value={selectedTradeYear}
                onValueChange={setSelectedTradeYear}
                disabled={isFetching}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTradeID &&
                    Array.from({
                      length:
                        tradeData.find((trade) => trade.$id === selectedTradeID)
                          ?.duration || 0,
                    }).map((_, idx) => (
                      <SelectItem
                        key={idx}
                        value={idx === 0 ? "FIRST" : "SECOND"}
                      >
                        {idx === 0 ? "FIRST" : "SECOND"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Subject
              </Label>
              <Select
                value={selectedSubjectID}
                onValueChange={(value) => {
                  setSelectedSubject(
                    subjectData.find((item) => item.$id === value)
                  );
                  setSelectedSubjectID(value);
                }}
                disabled={!selectedTradeID || isFetching}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectData.map((subject) => (
                    <SelectItem key={subject.$id} value={subject.$id}>
                      {subject.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {selectedTradeID && selectedSubjectID && (
        <div className="container px-6 py-6  overflow-y-auto mx-auto ">
          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Button
              disabled={loading}
              onClick={() => {
                setShow(new Set().add("AddModules"));
                setModuleId("");
                setTopicId("");
                setShowModulesList(false);
              }}
              className="w-full sm:w-auto gap-2 border-slate-200"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5" />
                  <span>New Module</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPromptModal(true)}
              className="w-full sm:w-auto gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
              size="lg"
            >
              <Wand2 className="h-4 w-4" />
              Generate Syllabus AI Prompt
            </Button>
          </div>

          {/* Responsive Layout */}
          <div className="flex flex-col lg:flex-row gap-6 ">
            {/* Modules List Sidebar */}
            <div
              className={`${
                hasActiveView && !showModulesList ? "hidden lg:block" : "block"
              } w-full lg:w-80 shrink-0`}
            >
              <Card className="overflow-hidden py-0">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-48 p-6">
                      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                    </div>
                  ) : newModules && newModules.length > 0 ? (
                    <ModulesList
                      syllabus={newModules}
                      setModuleId={(id) => {
                        setModuleId(id);
                        setShowModulesList(false);
                      }}
                      moduleId={moduleId}
                      setTopicId={(id) => {
                        setTopicId(id);
                        setShowModulesList(false);
                      }}
                      topicId={topicId}
                      setShow={setShow}
                      loading={loading}
                      itemRefs={itemRefs}
                    />
                  ) : (
                    <div className="flex flex-col justify-center items-center h-48 text-muted-foreground p-6 text-center">
                      <BookOpen className="h-10 w-10 mb-3 opacity-50" />
                      <p className="text-sm">No modules available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Content Area */}
            <div
              className={`${
                hasActiveView && !showModulesList ? "block" : "hidden lg:block"
              } flex-1  `}
            >
              {hasActiveView && (
                <Button
                  variant="ghost"
                  onClick={() => setShowModulesList(true)}
                  className="lg:hidden mb-4 gap-1.5 px-2"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back to Modules
                </Button>
              )}

              <Card className="p-0 w-full overflow-hidden">
                <CardContent className="w-full px-0  ">
                  {show.has("AddModules") && (
                    <AddModules
                      setNewModules={setNewModules}
                      newModules={newModules}
                      metaData={{
                        tradeId: selectedTradeID,
                        subjectId: selectedSubjectID,
                        subjectName: selectedSubject?.subjectName,
                        year: selectedTradeYear,
                      }}
                      moduleId={moduleId}
                      setShow={(newShow) => {
                        setShow(newShow);
                        if (newShow.size === 0) setShowModulesList(true);
                      }}
                      moduleTest={moduleTest}
                      trade={selectedTrade}
                      isPractical={isPractical}
                      scrollToItem={scrollToItem}
                    />
                  )}
                  {show.has("AddTopics") && (
                    <AddTopics
                      setNewModules={setNewModules}
                      newModules={newModules}
                      moduleId={moduleId}
                      topicId={topicId}
                      setTopicId={setTopicId}
                      setShow={(newShow) => {
                        setShow(newShow);
                        if (newShow.size === 0) setShowModulesList(true);
                      }}
                    />
                  )}
                  {show.has("showModules") && (
                    <ShowModules
                      setShow={(newShow) => {
                        setShow(newShow);
                        if (newShow.size === 0) setShowModulesList(true);
                      }}
                      newModules={newModules}
                      setNewModules={setNewModules}
                      moduleId={moduleId}
                    />
                  )}
                  {show.has("showTopics") && (
                    <ShowTopic
                      setShow={(newShow) => {
                        setShow(newShow);
                        if (newShow.size === 0) setShowModulesList(true);
                      }}
                      setNewModules={setNewModules}
                      newModules={newModules}
                      moduleId={moduleId}
                      topicId={topicId}
                    />
                  )}
                  {!hasActiveView && (
                    <div className="flex flex-col justify-center items-center h-64 text-muted-foreground p-8 text-center">
                      <BookOpen className="h-12 w-12 mb-4 opacity-40" />
                      <p className="text-sm">
                        Select a module or create a new one to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!selectedTradeID || !selectedSubjectID) && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] text-muted-foreground p-8 text-center">
          <Filter className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-base font-medium mb-2">Get Started</p>
          <p className="text-sm">
            Select a trade, year, and subject to view modules
          </p>
        </div>
      )}

      {/* AI Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-800">
            <div className="flex justify-between items-center p-4 border-b dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-blue-500" /> Syllabus Extractor AI Prompt
              </h3>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-sm border border-blue-100 dark:border-blue-800">
                This will generate a highly optimized prompt tailored to your currently selected Trade, Subject, and Year. Copy and paste it into ChatGPT/Claude to automatically parse syllabus text into a pristine markdown table.
              </div>
              
              <div className="space-y-2">
                <Label>Starting Module Sequence Number</Label>
                <div className="flex items-center">
                  <span className="flex items-center justify-center h-10 px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-md font-mono font-bold text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                    {isPractical ? "P" : "M"}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={startingNumber}
                    onChange={(e) => setStartingNumber(e.target.value)}
                    placeholder="1"
                    className="flex-1 flex h-10 rounded-r-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <p className="text-xs text-slate-500">The sequencer will automatically prefix with '{isPractical ? "P" : "M"}' based on the {selectedSubject?.subjectName || "Trade Theory"} subject type.</p>
              </div>

              <div className="space-y-2">
                <Label>Raw Syllabus Text (Optional)</Label>
                <textarea
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Paste the raw text from the syllabus PDF here..."
                  className="w-full min-h-[150px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 resize-y"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Button variant="ghost" onClick={() => setShowPromptModal(false)}>Cancel</Button>
              <Button onClick={handleCopyPrompt} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Copy className="w-4 h-4" /> Copy Prompt to Clipboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modules;
