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
import { useSearchParams } from "react-router-dom";

import { selectProfile } from "../../../../store/profileSlice";
import { calculateStats } from "../attaindance/CalculateStats";
import userProfileService from "../../../../appwrite/userProfileService";
import batchService from "../../../../appwrite/batchService";
import attendanceService from "../../../../appwrite/attaindanceService";

import ViewProfiles from "./profile/ViewProfiles";
import ViewAttendance from "./attendance/ViewAttendance";
import JobEvaluation from "./job-evalution/JobEvalution";
import ProgressCard from "./progress-card/ProgressCards";
import TraineeLeaveRecord from "./leave-record/LeaveRecord";

const TABS = [
  { id: "profiles", label: "Student Profiles", icon: Users },
  { id: "attendance", label: "Attendance Records", icon: ClipboardList },
  { id: "progress-card", label: "Progress Card", icon: TrendingUp },
  { id: "leave-record", label: "Leave Records", icon: Calendar },
  { id: "job-evaluation", label: "Job Evaluation", icon: Award },
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "achievements", label: "Achievements", icon: Award },
];

const ViewBatch = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [studentsLoading, setStudentLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [students, setStudents] = useState(null);

  const [studentsAttendance, setStudentsAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);

  const [teacherBatches, setTeacherBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(
    searchParams.get("batchid") || ""
  );
  const [selectedBatchData, setSelectedBatchData] = useState(null);

  const [activeTab, setActiveTab] = useState(
    searchParams.get("active") || "profiles"
  );

  const profile = useSelector(selectProfile);

  // Update search params whenever selected batch or active tab changes.
  useEffect(() => {
    setSearchParams({
      batchid: selectedBatch,
      active: activeTab,
    });
  }, [selectedBatch, activeTab, setSearchParams]);

  // Fetch teachers all batches
  const fetchTeacherBatches = async () => {
    setIsLoading(true);
    try {
      const data = await batchService.listBatches([
        Query.equal("teacherId", profile.userId),
        Query.select(["$id", "BatchName", "collegeId", "tradeId"]),
      ]);
      const batchesArray = Array.isArray(data.documents)
        ? data.documents
        : [data.documents];
      setTeacherBatches(batchesArray);
      // Initialize selectedBatch if it's empty and we have batches
      if (!selectedBatch && batchesArray.length > 0) {
        setSelectedBatch(batchesArray[0].$id);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatchData = async () => {
    if (!selectedBatch) return;
    setIsLoading(true);
    try {
      const data = await batchService.getBatch(selectedBatch);
      setSelectedBatchData(data);
    } catch (error) {
      console.error("Error fetching batch Data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch batch students
  const fetchBatchStudent = async () => {
    if (!selectedBatch) return;
    setStudentLoading(true);
    try {
      const data = await userProfileService.getBatchUserProfile([
        Query.equal("batchId", selectedBatch),
        Query.orderAsc("studentId"),
      ]);
      if (data && Array.isArray(data)) {
        setStudents(
          data.sort((a, b) => parseInt(a.studentId - parseInt(b.studentId)))
        );
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching batch students:", error);
    } finally {
      setStudentLoading(false);
    }
  };

  // Fetch student attendance
  const fetchStudentsAttendance = async () => {
    if (!students || !selectedBatch) return;
    setAttendanceLoading(true);
    try {
      const activeStudents = students.filter(
        (student) => student.status === "Active"
      );
      const studentsIds = activeStudents.map((student) => student.userId);

      if (studentsIds.length <= 0) {
        console.log("No students found!");
        setAttendanceStats([]);
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

      setStudentsAttendance(studentsWithStudentIds);
      setAttendanceStats(
        studentsWithStudentIds
          .sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId))
          .map((item) => calculateStats({ data: item }))
      );
    } catch (error) {
      console.error("Error fetching batch attendance:", error);
      setAttendanceStats([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Initial load of teacher batches
  useEffect(() => {
    fetchTeacherBatches();
  }, [profile.userId]); // Added dependency on profile.userId

  // Load students when selected batch changes
  useEffect(() => {
    if (selectedBatch) {
      fetchBatchData(); //fetch seleted batch data
      setStudents(null); // Reset students when batch changes
      fetchBatchStudent();
    }
  }, [selectedBatch]);

  // Load attendance stats when needed
  useEffect(() => {
    const needsAttendance = [
      "attendance",
      "progress-card",
      "leave-record",
      "job-evaluation",
    ].includes(activeTab);

    if (
      students &&
      selectedBatch &&
      needsAttendance &&
      !attendanceStats.length
    ) {
      fetchStudentsAttendance();
    }
  }, [students, activeTab, selectedBatch]);

  const renderContent = () => {
    if (
      studentsLoading ||
      ([
        "attendance",
        "progress-card",
        "leave-record",
        "job-evaluation",
      ].includes(activeTab) &&
        attendanceLoading)
    ) {
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
            isLoading={attendanceLoading}
          />
        );
      case "progress-card":
        return (
          <ProgressCard
            studentProfiles={students}
            stats={attendanceStats}
            batchData={selectedBatchData}
            isLoading={attendanceLoading}
          />
        );
      case "leave-record":
        return (
          <TraineeLeaveRecord
            studentProfiles={students}
            stats={attendanceStats}
            batchData={selectedBatchData}
          />
        );
      case "job-evaluation":
        return (
          <JobEvaluation
            studentProfiles={students.filter((item) =>
              item.role.includes("Student")
            )}
            stats={attendanceStats}
            batchData={selectedBatchData}
            attendance={studentsAttendance}
          />
        );
      case "assignments":
        return <div className="text-center">Assignments Coming Soon</div>;
      case "achievements":
        return <div className="text-center">Achievements Coming Soon</div>;
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
    <div className="container mx-auto p-4">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <select
          className="w-full md:w-64 p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          disabled={isLoading || teacherBatches.length === 0}
        >
          {teacherBatches.length === 0 ? (
            <option value="">No batches available</option>
          ) : (
            teacherBatches.map((item) => (
              <option key={item.$id} value={item.$id}>
                {item.BatchName}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Navigation Tabs */}
      {selectedBatchData && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <div className="flex space-x-1 p-2 min-w-max">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
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
      {selectedBatchData ? (
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
