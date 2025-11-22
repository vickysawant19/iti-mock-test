import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../store/profileSlice";
import { PlusCircle, BookOpen, Filter, ChevronRight } from "lucide-react";

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

import ModulesList from "./ModulesList";
import AddTopics from "./AddTopics";
import AddModules from "./AddModules";
import ShowModules from "./ShowModules";
import ShowTopic from "./ShowTopic";

import { useListTradesQuery } from "@/store/api/tradeApi";
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
  const profile = useSelector(selectProfile);

  const moduleTest = useModuleTestGenerator({
    tradeId: selectedTrade?.$id,
    tradeName: selectedTrade?.tradeName || "-",
    year: selectedTradeYear,
    userId: profile.userId,
    userName: profile.userName,
  });

  const isPractical =
    selectedSubject && selectedSubject.subjectName.includes("PRACTICAL");

  const { scrollToItem, itemRefs } = useScrollToItem(
    newModules || [],
    "moduleId"
  );

  // Use RTK Query to fetch trades; skip until profile is available
  const { data: tradesResponse, isLoading: tradesLoading } = useListTradesQuery(
    undefined,
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

  // Combined fetching flag for UI disables (trades OR subjects)
  const isFetching = fetchingData || tradesLoading;

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
          {/* Add Module Button */}
          <div className="mb-6">
            <Button
              disabled={loading}
              onClick={() => {
                setShow(new Set().add("AddModules"));
                setModuleId("");
                setTopicId("");
                setShowModulesList(false);
              }}
              className="w-full sm:w-auto gap-2"
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
    </div>
  );
};

export default Modules;
