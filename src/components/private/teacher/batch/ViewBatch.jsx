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
  ChevronDown,
  Loader2,
} from "lucide-react";
import { selectProfile } from "../../../../store/profileSlice";
import { calculateStats } from "../attaindance/CalculateStats";
import userProfileService from "../../../../appwrite/userProfileService";
import batchService from "../../../../appwrite/batchService";
import attendanceService from "../../../../appwrite/attaindanceService";
import LoadingState from "./components/LoadingState";
import TabNavigation from "./components/TabNavigation";
import ViewProfiles from "./profile/ViewProfiles";
import ViewAttendance from "./attendance/ViewAttendance";
import JobEvaluation from "./job-evalution/JobEvalution";
import ProgressCard from "./progress-card/ProgressCards";
import TraineeLeaveRecord from "./leave-record/LeaveRecord";
import Students from "./profile/Students";
import CustomSelector from "../../../components/CustomSelector";

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

// Empty state component for better UX
const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="bg-white rounded-lg shadow-xs p-8 md:p-12 text-center">
    <Icon className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" />
    <h3 className="text-lg md:text-xl font-medium text-gray-500">{title}</h3>
    {description && <p className="mt-2 text-gray-400">{description}</p>}
  </div>
);

// Feature placeholder component
const FeaturePlaceholder = ({ icon: Icon, title }) => (
  <div className="bg-white rounded-lg shadow-xs p-8 text-center text-gray-500">
    <Icon className="w-12 h-12 mx-auto mb-4 text-blue-500" />
    <h3 className="text-xl font-medium">{title}</h3>
    <p className="mt-2">This feature is under development.</p>
  </div>
);

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

  // Reset students data when batch changes
  useEffect(() => {
    fetchedStudentsRef.current = false;
    setData((prev) => ({ ...prev, students: null }));
  }, [selectedBatch]);

  const setLoading = (key, value) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  // Update URL params when batch or tab changes
  useEffect(() => {
    const batchId = data.teacherBatches.some(
      (batch) => batch.$id === selectedBatch
    )
      ? selectedBatch
      : data.teacherBatches[0]?.$id || "";

    setSearchParams((prevData) => {
      const data = Object.fromEntries(prevData);
      return { ...data, batchid: batchId, active: activeTab };
    });
  }, [selectedBatch, activeTab, data.teacherBatches, setSearchParams]);

  // Fetch teacher's batches
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

      // Auto-select first batch if none selected
      if (!selectedBatch && batchesArray.length > 0) {
        setSelectedBatch(batchesArray[0].$id);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading("batches", false);
    }
  }, [profile.userId, selectedBatch]);

  // Fetch batch data
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

  // Fetch batch students
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

  // Fetch students attendance
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

      // Create student lookup map
      const studentMap = new Map();
      data.students.forEach((student) => {
        studentMap.set(student.userId, student);
      });

      // Enrich attendance data with student info
      const enrichedAttendance = attendance.map((record) => ({
        ...record,
        studentId: studentMap.get(record.userId)?.studentId || "NA",
        userName:
          studentMap.get(record.userId)?.userName ||
          record?.userName ||
          "Unknown",
      }));

      // Sort by student ID
      const sortedAttendance = enrichedAttendance.sort(
        (a, b) => parseInt(a.studentId) - parseInt(b.studentId)
      );

      // Calculate stats for each student
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

  // Initial fetch for teacher batches
  useEffect(() => {
    fetchTeacherBatches();
  }, [fetchTeacherBatches]);

  // Fetch batch data when selected batch changes
  useEffect(() => {
    if (selectedBatch) {
      fetchBatchData();
    }
  }, [selectedBatch, fetchBatchData]);

  // Fetch students when batch data is available
  useEffect(() => {
    if (data.selectedBatchData) {
      fetchBatchStudents();
    }
  }, [data.selectedBatchData, fetchBatchStudents]);

  // Fetch attendance when needed for specific tabs
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

  // Render content based on active tab
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
        return (
          <FeaturePlaceholder icon={BookOpen} title="Assignments Coming Soon" />
        );
      case "achievements":
        return (
          <FeaturePlaceholder icon={Award} title="Achievements Coming Soon" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-4 text-sm">
      <div className="bg-white p-4 rounded-xl shadow-xs">
        {/* New Enhanced Batch Selector */}
        <h1 className="mb-2 text-gray-500">Select Batch</h1>
        <CustomSelector
          onValueChange={setSelectedBatch}
          valueKey="$id"
          displayKey="BatchName"
          selectedValue={selectedBatch}
          isLoading={loadingStates.batches}
          options={data.teacherBatches}
          disabled={loadingStates.batchData}
          icon={Users}
          placeholder="Select Batch"
        />
      </div>

      {data.selectedBatchData && (
        <div className="bg-white rounded-xl shadow-xs  overflow-x-auto">
          <TabNavigation
            tabs={TABS}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      )}

      {loadingStates.batchData && <LoadingState size={50} fullPage />}

      {!loadingStates.batchData && !data.selectedBatchData && (
        <EmptyState
          icon={Users}
          title="Please select a batch to view details"
          description="No batch data currently available"
        />
      )}

      {!loadingStates.batchData && data.selectedBatchData && (
        <div className="bg-white rounded-xl shadow-xs overflow-hidden p-4">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default ViewBatch;
