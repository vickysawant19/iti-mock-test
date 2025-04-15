import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  ClipboardList,
  TrendingUp,
  Calendar,
  BookOpen,
  Award,
} from "lucide-react";
import { selectProfile } from "../../../../store/profileSlice";
import { calculateStats } from "../attaindance/CalculateStats";
import userProfileService from "../../../../appwrite/userProfileService";
import batchService from "../../../../appwrite/batchService";
import attendanceService from "../../../../appwrite/attaindanceService";
import LoadingState from "./components/LoadingState";
import TabNavigation from "./components/TabNavigation";
import BatchSelector from "./components/BatchSelector";
import ViewProfiles from "./profile/ViewProfiles";
import ViewAttendance from "./attendance/ViewAttendance";
import JobEvaluation from "./job-evalution/JobEvalution";
import ProgressCard from "./progress-card/ProgressCards";
import TraineeLeaveRecord from "./leave-record/LeaveRecord";
import Students from "./profile/Students";

const TABS = [
  { id: "students", label: "Student", icon: Users },
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
  const profile = useSelector(selectProfile);
  const [loadingStates, setLoadingStates] = useState({
    batches: false,
    batchData: false,
    students: false,
    attendance: false,
  });
  const [data, setData] = useState({
    teacherBatches: [],
    selectedBatchData: null,
    students: null,
    studentsAttendance: [],
    attendanceStats: [],
  });
  const [selectedBatch, setSelectedBatch] = useState(
    searchParams.get("batchid") || ""
  );
  const [activeTab, setActiveTab] = useState(
    searchParams.get("active") || "profiles"
  );
  const fetchedStudentsRef = useRef(false);

  useEffect(() => {
    fetchedStudentsRef.current = false;
    setData((prev) => ({ ...prev, students: null }));
  }, [selectedBatch]);

  const setLoading = (key, value) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const batchId = data.teacherBatches.some(
      (batch) => batch.$id === selectedBatch
    )
      ? selectedBatch
      : profile.batchId;
    setSearchParams((prevData) => {
      const data = Object.fromEntries(prevData);
      return { ...data, batchid: batchId, active: activeTab };
    });
  }, [selectedBatch, activeTab, data.teacherBatches, profile.batchId]);

  const fetchTeacherBatches = useCallback(async () => {
    setLoading("batches", true);
    try {
      const result = await batchService.listBatches([
        Query.equal("teacherId", profile.userId),
        Query.select(["$id", "BatchName", "collegeId", "tradeId"]),
      ]);
      const batchesArray = Array.isArray(result.documents)
        ? result.documents
        : [result.documents];
      setData((prev) => ({ ...prev, teacherBatches: batchesArray }));
      if (!selectedBatch && batchesArray.length > 0) {
        setSelectedBatch(batchesArray[0].$id);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading("batches", false);
    }
  }, [profile.userId]);

  const fetchBatchData = useCallback(async () => {
    if (!selectedBatch) return;
    setLoading("batchData", true);
    try {
      const result = await batchService.getBatch(selectedBatch);
      setData((prev) => ({ ...prev, selectedBatchData: result }));
    } catch (error) {
      console.error("Error fetching batch data:", error);
    } finally {
      setLoading("batchData", false);
    }
  }, [selectedBatch]);

  const fetchBatchStudents = useCallback(async () => {
    if (!data.selectedBatchData) return;

    const studentIds = data.selectedBatchData.studentIds
      .map((item) => {
        try {
          return JSON.parse(item).userId;
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);

    if (studentIds.length === 0) {
      setData((prev) => ({ ...prev, students: [] }));
      return;
    }

    setLoading("students", true);
    try {
      const result = await userProfileService.getBatchUserProfile([
        Query.equal("userId", studentIds),
        Query.orderAsc("studentId"),
      ]);
      const sortedStudents = result.sort(
        (a, b) => parseInt(a.studentId) - parseInt(b.studentId)
      );
      setData((prev) => ({ ...prev, students: sortedStudents }));
    } catch (error) {
      console.error("Error fetching batch students:", error);
      setData((prev) => ({ ...prev, students: [] }));
    } finally {
      setLoading("students", false);
      fetchedStudentsRef.current = true;
    }
  }, [data.selectedBatchData]);

  const fetchStudentsAttendance = useCallback(async () => {
    if (!data.students || !data.selectedBatchData) return;
    setLoading("attendance", true);
    try {
      const activeStudents = data.students.filter(
        (student) => student.status === "Active"
      );
      const studentIds = activeStudents.map((student) => student.userId);
      if (studentIds.length <= 0) {
        setData((prev) => ({ ...prev, attendanceStats: [] }));
        return;
      }
      const attendance = await attendanceService.getStudentsAttendance([
        Query.equal("userId", studentIds),
        Query.equal("batchId", data.selectedBatchData.$id),
        Query.orderDesc("$updatedAt"),
      ]);
      const studentMap = new Map();
      data.students.forEach((student) => {
        studentMap.set(student.userId, student);
      });
      const enrichedAttendance = attendance.map((record) => ({
        ...record,
        studentId: studentMap.get(record.userId)?.studentId || "NA",
        userName:
          studentMap.get(record.userId)?.userName ||
          record?.userName ||
          "Unknown",
      }));
      const sortedAttendance = enrichedAttendance.sort(
        (a, b) => parseInt(a.studentId) - parseInt(b.studentId)
      );
      const stats = sortedAttendance.map((item) =>
        calculateStats({ data: item })
      );
      setData((prev) => ({
        ...prev,
        studentsAttendance: sortedAttendance,
        attendanceStats: stats,
      }));
    } catch (error) {
      console.error("Error fetching batch attendance:", error);
      setData((prev) => ({ ...prev, attendanceStats: [] }));
    } finally {
      setLoading("attendance", false);
    }
  }, [data.students, data.selectedBatchData]);

  useEffect(() => {
    fetchTeacherBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchBatchData();
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (data.selectedBatchData) {
      console.log("fetch batch studentss");
      fetchBatchStudents();
    }
  }, [data.selectedBatchData]);

  useEffect(() => {
    const needsAttendance = [
      "attendance",
      "progress-card",
      "leave-record",
      "job-evaluation",
      "students",
    ].includes(activeTab);
    if (
      data.students &&
      selectedBatch &&
      needsAttendance &&
      !loadingStates.attendance &&
      !data.attendanceStats.length
    ) {
      fetchStudentsAttendance();
    }
  }, [
    data.students,
    activeTab,
    selectedBatch,
    data.attendanceStats.length,
    fetchStudentsAttendance,
    loadingStates.attendance,
  ]);

  const renderContent = () => {
    const isContentLoading =
      loadingStates.students ||
      ([
        "attendance",
        "progress-card",
        "leave-record",
        "job-evaluation",
        "students",
      ].includes(activeTab) &&
        loadingStates.attendance);
    if (isContentLoading) {
      return <LoadingState size={40} />;
    }
    switch (activeTab) {
      case "students":
        return (
          <Students
            selectedBatchData={data.selectedBatchData}
            setSelectedBatchData={(newData) =>
              setData((prev) => ({ ...prev, selectedBatchData: newData }))
            }
          />
        );
      case "profiles":
        return <ViewProfiles students={data.students} />;
      case "attendance":
        return (
          <ViewAttendance
            students={data.students}
            stats={data.attendanceStats}
            isLoading={loadingStates.attendance}
          />
        );
      case "progress-card":
        return (
          <ProgressCard
            studentProfiles={data.students}
            stats={data.attendanceStats}
            batchData={data.selectedBatchData}
            setBatchData={(newData) =>
              setData((prev) => ({ ...prev, selectedBatchData: newData }))
            }
            isLoading={loadingStates.attendance}
          />
        );
      case "leave-record":
        return (
          <TraineeLeaveRecord
            studentProfiles={data.students}
            stats={data.attendanceStats}
            batchData={data.selectedBatchData}
          />
        );
      case "job-evaluation":
        return (
          <JobEvaluation
            studentProfiles={
              data.students?.filter((item) => item.role?.includes("Student")) ||
              []
            }
            stats={data.attendanceStats}
            batchData={data.selectedBatchData}
            attendance={data.studentsAttendance}
          />
        );
      case "assignments":
      case "achievements":
        return (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            {activeTab === "assignments" ? (
              <>
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-medium">Assignments Coming Soon</h3>
              </>
            ) : (
              <>
                <Award className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-medium">
                  Achievements Coming Soon
                </h3>
              </>
            )}
            <p className="mt-2">This feature is under development.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <BatchSelector
        selectedBatch={selectedBatch}
        setSelectedBatch={setSelectedBatch}
        batches={data.teacherBatches}
        isLoading={loadingStates.batches}
      />
      {data.selectedBatchData && (
        <TabNavigation
          tabs={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
      {loadingStates.batchData && <LoadingState size={50} fullPage />}
      {!loadingStates.batchData &&
        (data.selectedBatchData ? (
          renderContent()
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-500">
              Please select a batch to view details
            </h3>
            <p className="mt-2 text-gray-400">
              No batch data currently available
            </p>
          </div>
        ))}
    </div>
  );
};

export default ViewBatch;
