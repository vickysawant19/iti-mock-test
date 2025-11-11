import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../store/profileSlice";
import { PlusCircle, Save, BookOpen, Filter, Images } from "lucide-react";
import { Query } from "appwrite";

import ModulesList from "./ModulesList";
import AddTopics from "./AddTopics";
import AddModules from "./AddModules";
import ShowModules from "./ShowModules";
import ShowTopic from "./ShowTopic";

import tradeservice from "../../../appwrite/tradedetails";
import subjectService from "../../../appwrite/subjectService";
import moduleServices from "../../../appwrite/moduleServices";
import useModuleTestGenerator from "./module-assignment/ModuleTestGenerator";
import useScrollToItem from "../../../utils/useScrollToItem";

const Modules = () => {
  const [tradeData, setTradeData] = useState([]);
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

  const fetchTrades = async () => {
    setFetchingData(true);
    try {
      const data = await tradeservice.listTrades();
      setTradeData(data.documents);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setFetchingData(false);
    }
  };

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
      fetchTrades();
      fetchSubjects();
    }
  }, [profile]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-blue-900 dark:text-white py-6 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-900 dark:text-white" />
              <h1 className="text-2xl font-bold">Module Management System</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex sm:flex-row flex-col flex-wrap gap-4 mb-6 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Trade
              </label>
            </div>
            <select
              value={selectedTradeID}
              onChange={(e) => setSelectedTradeID(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
              disabled={fetchingData}
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
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Year
              </label>
            </div>
            <select
              value={selectedTradeYear}
              onChange={(e) => setSelectedTradeYear(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
              disabled={fetchingData}
            >
              <option value="">Select Year</option>
              {selectedTradeID &&
                Array.from({
                  length: tradeData.find(
                    (trade) => trade.$id === selectedTradeID
                  ).duration,
                }).map((_, idx) => (
                  <option key={idx} value={idx === 0 ? "FIRST" : "SECOND"}>
                    {idx === 0 ? "FIRST" : "SECOND"}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
            </div>
            <select
              value={selectedSubjectID}
              onChange={(e) => {
                setSelectedSubject(
                  subjectData.find((item) => item.$id === e.target.value)
                );
                setSelectedSubjectID(e.target.value);
              }}
              className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              disabled={!selectedTradeID || fetchingData}
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

        {selectedTradeID && selectedSubjectID && (
          <div className="mb-6">
            {/* Add Module Button - Positioned above the grid */}
            <div className="mb-4">
              <button
                disabled={loading}
                onClick={() => {
                  setShow(new Set().add("AddModules"));
                  setModuleId("");
                  setTopicId("");
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">Adding...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span className="font-medium">New Module</span>
                  </>
                )}
              </button>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Modules List - Left Side */}
              <div className="col-span-1 rounded-xl">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-10 h-10 border-t-4 border-blue-500 dark:border-blue-400 rounded-full animate-spin" />
                  </div>
                ) : newModules && newModules.length > 0 ? (
                  <ModulesList
                    syllabus={newModules}
                    setModuleId={setModuleId}
                    moduleId={moduleId}
                    setTopicId={setTopicId}
                    topicId={topicId}
                    setShow={setShow}
                    loading={loading}
                    itemRefs={itemRefs}
                  />
                ) : (
                  <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400">
                    No modules available.
                  </div>
                )}
              </div>

              {/* Content Area - Right Side */}
              <div className="lg:col-span-2 col-span-1 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800">
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
                    setShow={setShow}
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
                    setShow={setShow}
                  />
                )}
                {show.has("showModules") && (
                  <ShowModules
                    setShow={setShow}
                    newModules={newModules}
                    setNewModules={setNewModules}
                    moduleId={moduleId}
                  />
                )}
                {show.has("showTopics") && (
                  <ShowTopic
                    setShow={setShow}
                    setNewModules={setNewModules}
                    newModules={newModules}
                    moduleId={moduleId}
                    topicId={topicId}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modules;
