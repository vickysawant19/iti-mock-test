import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../store/profileSlice";
import tradeservice from "../../../appwrite/tradedetails";
import subjectService from "../../../appwrite/subjectService";
import moduleServices from "../../../appwrite/moduleServices";
import { Query } from "appwrite";
import ModulesList from "./ModulesList";
import AddTopics from "./AddTopics";
import AddModules from "./AddModules";
import ShowModules from "./ShowModules";
import ShowTopic from "./ShowTopic";
import { PlusCircle, Save, BookOpen, Filter } from "lucide-react";

const Modules = () => {
  const [tradeData, setTradeData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [selectedTradeID, setSelectedTradeID] = useState("");
  const [selectedSubjectID, setSelectedSubjectID] = useState("");
  const [selectedTradeYear, setSelectedTradeYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [moduleId, setModuleId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [modules, setModules] = useState({
    tradeId: selectedTradeID,
    subjectId: selectedSubjectID,
  });

  const [show, setShow] = useState(new Set());

  const profile = useSelector(selectProfile);

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
      const data = await moduleServices.listModules([
        Query.equal("tradeId", selectedTradeID),
        Query.equal("year", selectedTradeYear),
        Query.equal("subjectId", selectedSubjectID),
      ]);
      setShow(new Set());
      console.log(data)
      setModules(
        data || {
          tradeId: selectedTradeID,
          subjectId: selectedSubjectID,
          year: selectedTradeYear,
          syllabus: [],
        }
      );
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

  const submitModuleData = async () => {
    setLoading(true);
    try {
      if (modules.$id) {
        const res = await moduleServices.updateModules(modules.$id, modules);
        setModules(res);
      } else {
        const res = await moduleServices.createModules(modules);
        setModules(res);
      }
    } catch (error) {
      console.log("module error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = () => {
    if (!moduleId) return;
    if (!confirm("Deleteing Module with Module Id:", moduleId)) return;
    setModules((prev) => {
      return {
        ...prev,
        syllabus: prev.syllabus.filter((m) => m.moduleId !== moduleId),
      };
    });
  };

  const handleDeleteTopic = () => {
    if (!moduleId || !topicId) return;
    if (!confirm("Deleteing Topic with Topic Id:", topicId)) return;

    setModules((prev) => {
      return {
        ...prev,
        syllabus: prev.syllabus.map((m) =>
          m.moduleId === moduleId
            ? { ...m, topics: m.topics.filter((t) => t.topicId !== topicId) }
            : m
        ),
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 py-6 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Module Management System</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 ">
        <div className="flex sm:flex-row flex-col flex-wrap gap-4 mb-6 p-6 bg-white shadow-lg rounded-lg">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">Trade</label>
            </div>
            <select
              value={selectedTradeID}
              onChange={(e) => setSelectedTradeID(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
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
              <Filter className="w-4 h-4 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">Year</label>
            </div>
            <select
              value={selectedTradeYear}
              onChange={(e) => setSelectedTradeYear(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
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
              <Filter className="w-4 h-4 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">
                Subject
              </label>
            </div>
            <select
              value={selectedSubjectID}
              onChange={(e) => setSelectedSubjectID(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          <div className="mb-6 sticky top-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="col-span-full flex justify-end gap-4">
                <button
                  disabled={loading}
                  onClick={() => {
                    setShow(new Set().add("AddModules"));
                    setModuleId("");
                    setTopicId("");
                  }}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                >
                  <PlusCircle className="w-5 h-5" />
                  {loading ? (
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                  ) : (
                    "Add New Module"
                  )}
                </button>
                <button
                  disabled={loading}
                  onClick={submitModuleData}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300"
                >
                  <Save className="w-5 h-5" />
                  {loading ? (
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>

              <div className="col-span-1">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-10 h-10 border-t-4 border-blue-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  modules?.syllabus?.length > 0 && (
                    <ModulesList
                      syllabus={modules?.syllabus}
                      setModuleId={setModuleId}
                      setTopicId={setTopicId}
                      topicId={topicId}
                      moduleId={moduleId}
                      setShow={setShow}
                    />
                  )
                )}
              </div>

              <div className="lg:col-span-2 md:col-span-1 flex flex-wrap flex-col">
                {show.has("AddModules") && (
                  <AddModules
                    setModules={setModules}
                    modules={modules}
                    moduleId={moduleId}
                    setShow={setShow}
                  />
                )}
                {show.has("AddTopics") && (
                  <AddTopics
                    setModules={setModules}
                    modules={modules}
                    moduleId={moduleId}
                    topicId={topicId}
                    setShow={setShow}
                  />
                )}
                {show.has("showModules") && (
                  <ShowModules
                    setShow={setShow}
                    handleDeleteModule={handleDeleteModule}
                    module={modules.syllabus.find(
                      (item) => item.moduleId === moduleId
                    )}
                  />
                )}
                {show.has("showTopics") && (
                  <ShowTopic
                    setShow={setShow}
                    handleDeleteTopic={handleDeleteTopic}
                    topic={modules.syllabus
                      .find((item) => item.moduleId === moduleId)
                      ?.topics.find((item) => item.topicId === topicId)}
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
