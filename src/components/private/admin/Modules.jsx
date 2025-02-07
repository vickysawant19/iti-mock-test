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
import ModulesList from "./ModulesList";
import AddTopics from "./AddTopics";
import AddModules from "./AddModules";
import ShowModules from "./ShowModules";
import ShowTopic from "./ShowTopic";

const dummySyllabus = {
  tradeId: "TRADE-001",
  subjectId: "SUBJ-101",
  syllabus: [
    {
      moduleId: "MOD-101",
      moduleName: "Introduction to Carpentry",
      moduleDuration: 40,
      learningOutcome:
        "Understand basic woodworking techniques and tool safety",
      moduleDescription:
        "Foundation course covering essential carpentry skills and workshop safety protocols",
      hours: 10,
      topics: [
        {
          topicId: "TOP-1011",
          topicName: "Wood Types and Properties",
          hours: 4,
          resources: ["Wood_Handbook.pdf", "Material_Samples.zip"],
          assessment: "Material Identification Test",
        },
        {
          topicId: "TOP-1012",
          topicName: "Basic Tool Handling",
          hours: 6,
          resources: ["Tool_Safety_Video.mp4", "Toolkit_Checklist.pdf"],
          assessment: "Practical Demonstration and Quiz",
        },
      ],
    },
    {
      moduleId: "MOD-102",
      moduleName: "Advanced Joinery Techniques",
      moduleDuration: 60,
      learningOutcome: "Master complex wood joints and furniture construction",
      moduleDescription:
        "Advanced techniques for creating durable joints and custom furniture pieces",
      hours: 15,
      topics: [
        {
          topicId: "TOP-1021",
          topicName: "Mortise and Tenon Joints",
          hours: 8,
          resources: ["Joint_Designs.pdf", "Workshop_Guide.docx"],
          assessment: "Practical Joint Construction",
        },
        {
          topicId: "TOP-1022",
          topicName: "Cabinet Making Basics",
          hours: 7,
          resources: ["Cabinet_Plans.zip", "Finishing_Techniques.mp4"],
          assessment: "Cabinet Construction Project",
        },
      ],
    },
  ],
};

const Modules = () => {
  const [tradeData, setTradeData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [selectedTradeID, setSelectedTradeID] = useState("");
  const [selectedSubjectID, setSelectedSubjectID] = useState("");
  const [modules, setModules] = useState(dummySyllabus);
  const [moduleId, setModuleId] = useState("");
  const [topicId, setTopicId] = useState("");



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
      setModules(dummySyllabus);
      // setModules(data.documents[0]);
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

      console.log(newModule);

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
    <div className="bg-white">
      <header className="bg-blue-600 text-white py-6 mb-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-center">
              Module Management System
            </h1>
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

        {
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-6">Manage Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="col-span-1">
                <h1>Modules</h1>
                <button className="bg-blue-300 p-2 w-full mb-2 rounded">
                  Add Module
                </button>
                <ModulesList
                  syllabus={modules?.syllabus}
                  setModuleId={setModuleId}
                  setTopicId={setTopicId}
                  topicId={topicId}
                  moduleId={moduleId}
                //   setShowModuleForm={setShowModuleForm}
                //   setShowTopicForm={setShowTopicForm}
                />
              </div>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 col-span-2"
              >
                <AddModules register={register} errors={errors} />
                <ShowModules module={modules.syllabus.filter(item => item.moduleId === moduleId)} />
                <AddTopics register={register} errors={errors} />
                {/* <ShowTopic topic={modules.syllabus.filter(item => item.filter(item1 => item1.topicId === topicId))}/> */}

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
          </div>
        }
      </div>
    </div>
  );
};

export default Modules;
