import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import { ClipLoader } from "react-spinners";
import {
  Users,
  ClipboardList,
  TrendingUp,
  Calendar,
  BookOpen,
  Award,
} from "lucide-react";

import { selectProfile } from "../../../../store/profileSlice";
import userProfileService from "../../../../appwrite/userProfileService";
import batchService from "../../../../appwrite/batchService";
import attendanceService from "../../../../appwrite/attaindanceService";
import { calculateStats } from "../attaindance/CalculateStats";
import ViewProfiles from "./ViewProfiles";
import ViewAttendance from "./ViewAttendance";
import ProgressCard from "./ProgressCards";
import TraineeLeaveRecord from "./LeaveRecord";
import { selectUser } from "../../../../store/userSlice";
import JobEvaluation from "./job-evalution/JobEvalution";

const TABS = [
  { id: "profiles", label: "Student Profiles", icon: Users },
  { id: "attendance", label: "Attendance Records", icon: ClipboardList },
  { id: "progress-card", label: "Progress Card", icon: TrendingUp },
  { id: "leave-record", label: "Leave Records", icon: Calendar },
  { id: "job-evalution", label: "Job Evalution", icon: Award },
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "achievements", label: "Achievements", icon: Award },
];

const ViewBatch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [studentsLoading, setStudentLoading] = useState(false);
  const [attendaceLoading, setAttendaceLoading] = useState(false);
  const [students, setStudents] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [teacherBatches, setTeacherBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [activeTab, setActiveTab] = useState("profiles");

  const profile = useSelector(selectProfile);

  const fetchTeacherBatches = async () => {
    setIsLoading(true);
    try {
      const data = await batchService.listBatches([
        Query.equal("teacherId", profile.userId),
      ]);
      setTeacherBatches(
        Array.isArray(data.documents) ? data.documents : [data.documents]
      );
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatchStudent = async () => {
    setStudentLoading(true);
    try {
      const data = await userProfileService.getBatchUserProfile([
        Query.equal("batchId", selectedBatch),
      ]);
      data.sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId));
      setStudents(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error("Error fetching batch students:", error);
    } finally {
      setStudentLoading(false);
    }
  };

  const fetchStudentsAttendance = async () => {
    if (!students) return;
    setAttendaceLoading(true);
    try {
      const studentsIds = students
        .filter((student) => student.status === "Active")
        .map((student) => student.userId);
      if (studentsIds.length < 0) {
        setAttendaceLoading(false);
        console.log("No students found!");
        return;
      }
      const attendance = await attendanceService.getStudentsAttendance([
        Query.equal("userId", studentsIds),
        Query.equal("batchId", selectedBatch),
      ]);

      const studentMap = new Map();
      students.forEach((student) => {
        studentMap.set(student.userId, student);
      });

      const studentsWithStudentIds = attendance.map((attendance) => {
        const student = studentMap.get(attendance.userId);
        return {
          ...attendance,
          studentId: student?.studentId || "NA",
          userName: student
            ? student.userName
            : attendance?.userName || "Unknown",
        };
      });

      setStudentAttendance(
        Array.isArray(studentsWithStudentIds)
          ? studentsWithStudentIds
          : [studentsWithStudentIds]
      );
      setAttendanceStats(
        studentsWithStudentIds
          .sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId))
          .map((item) => calculateStats({ data: item }))
      );
    } catch (error) {
      console.error("Error fetching batch attendance:", error);
    } finally {
      setAttendaceLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatch) {
      setSelectedBatch(teacherBatches.length > 0 ? teacherBatches[0].$id : "");
    } else {
      fetchBatchStudent();
    }
  }, [selectedBatch, teacherBatches]);

  useEffect(() => {
    if (
      (activeTab === "attendance" ||
        activeTab === "progress-card" ||
        activeTab === "leave-record") &&
      selectedBatch !== "" &&
      studentAttendance.length === 0
    ) {
      fetchStudentsAttendance();
    }
  }, [activeTab, selectedBatch, studentAttendance.length]);

  const renderContent = () => {
    if (studentsLoading || attendaceLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <ClipLoader size={40} color="#2563eb" loading={true} />
        </div>
      );
    }

    if (!students || !students.length) {
      return (
        <div className="text-center text-gray-500 py-10">
          No students found in this batch
        </div>
      );
    }

    switch (activeTab) {
      case "profiles":
        return <ViewProfiles students={students} />;
      case "attendance":
        return (
          <ViewAttendance
            students={students}
            stats={attendanceStats}
            isLoading={attendaceLoading}
          />
        );
      case "progress-card":
        return (
          <ProgressCard
            studentProfiles={students}
            stats={attendanceStats}
            isLoading={attendaceLoading}
            batchData={teacherBatches.find(
              (item) => item.$id === selectedBatch
            )}
          />
        );
      case "leave-record":
        return (
          <TraineeLeaveRecord
            studentProfiles={students}
            stats={attendanceStats}
            batchData={teacherBatches.find(
              (item) => item.$id === selectedBatch
            )}
          />
        );

      case "job-evalution":
        return (
          <JobEvaluation
            studentProfiles={students.filter(
              (item) =>
                item.status === "Active" && item.role.includes("Student")
            )}
            stats={attendanceStats}
            batchData={teacherBatches.find(
              (item) => item.$id === selectedBatch
            )}
          />
        );
      case "assignments":
        return <div className="text-center ">Assignments Coming Soon</div>;
      case "achievements":
        return <div className="text-center ">Achievements Coming Soon</div>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 ">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <select
          className="w-full md:w-64 p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          {teacherBatches.map((item) => (
            <option key={item.$id} value={item.$id}>
              {item.BatchName}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Tabs */}
      {selectedBatch && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <div className="flex space-x-1 p-2 min-w-max">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap
                      ${
                        activeTab === id
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}

      {selectedBatch ? (
        renderContent()
      ) : (
        <div className="text-center text-gray-500 py-10">
          Please select a batch to view details
        </div>
      )}
    </div>
  );
};

export default ViewBatch;
