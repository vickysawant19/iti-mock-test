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
import { selectProfile } from "@/store/profileSlice";
import { calculateStats } from "../../Attendance/CalculateStats";
import userProfileService from "@/appwrite/userProfileService";
import batchService from "@/appwrite/batchService";
import batchStudentService from "@/appwrite/batchStudentService";

import LoadingState from "./components/LoadingState";
import TabNavigation from "./components/TabNavigation";
import ViewProfiles from "./profile/ViewProfiles";
import ViewAttendance from "../../Attendance/ViewAttendance";
import JobEvaluation from "./job-evalution/JobEvalution";
import ProgressCard from "./progress-card/ProgressCards";
import TraineeLeaveRecord from "./leave-record/LeaveRecord";
import EmptyState from "./components/EmptyState";
import FeaturePlaceholder from "./components/FeaturePlaceholder";
import Assignment from "./assignment/Assignment";
import { newAttendanceService } from "@/appwrite/newAttendanceService";

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
  const profile = useSelector(selectProfile);
  const [loadingStates, setLoadingStates] = useState({
    batchData: false,
    students: false,
    attendance: false,
  });
  const [data, setData] = useState({
    selectedBatchData: null,
    students: null,
    studentsAttendance: [],
    attendanceStats: null,
  });
  const [selectedBatch, setSelectedBatch] = useState(
    searchParams.get("batchid") || profile?.batchId || ""
  );

  // Sync selectedBatch from search params 
  useEffect(() => {
    if (searchParams.get("batchid")) {
      setSelectedBatch(searchParams.get("batchid"));
    } else if (profile?.batchId) {
      setSelectedBatch(profile.batchId);
    }
  }, [searchParams.get("batchid"), profile?.batchId]);
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
    const batchId = selectedBatch;

    if (batchId) {
      setSearchParams((prevData) => {
        const queryData = Object.fromEntries(prevData);
        return { ...queryData, batchid: batchId, active: activeTab };
      });
    }
  }, [selectedBatch, activeTab, setSearchParams]);

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

    setLoading("students", true);
    try {
      // 1. Fetch approved memberships from batchStudents
      const batchMembers = await batchStudentService.getBatchStudents(data.selectedBatchData.$id);
      const studentIds = batchMembers.map(member => member.studentId).filter(Boolean);

      if (studentIds.length === 0) {
        setData((prev) => ({ ...prev, students: [] }));
        setLoading("students", false);
        fetchedStudentsRef.current = true;
        return;
      }

      // 2. Fetch the actual user profiles using the member IDs
      const result = await userProfileService.getBatchUserProfile([
        Query.equal("userId", studentIds),
        Query.orderAsc("studentId"),
        Query.limit(100)
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

      const newAttendance = data.students.map(async (student) => {
        return await newAttendanceService.getStudentAttendance(
          student.userId,
          data.selectedBatchData.$id
        );
      });

      const result = await Promise.all(newAttendance);
      // Create student lookup map
      const studentMap = new Map();
      data.students.forEach((student) => {
        studentMap.set(student.userId, student);
      });

      const newEnrichedAttendance = result.map((recordsObj, index) => {
        const originalStudent = data.students[index];
        const studentData = studentMap.get(originalStudent.userId);

        return {
          attendanceRecords: recordsObj,
          batchId: data.selectedBatchData.$id,
          studentId: studentData?.studentId || "NA",
          userName: studentData?.userName || "Unknown",
          userId: studentData?.userId || "NA",
          ...studentData,
        };
      });

      // Calculate stats for each student
      const stats = newEnrichedAttendance.map((item) => {
        return calculateStats({
          userId: item.userId,
          studentId: item.studentId,
          userName: item.userName,
          data: item.attendanceRecords,
        });
      });

      setData((prev) => ({
        ...prev,
        studentsAttendance: newEnrichedAttendance,
        attendanceStats: stats,
      }));
    } catch (error) {
      console.error("Error fetching batch attendance:", error);
      setData((prev) => ({ ...prev, attendanceStats: [] }));
    } finally {
      setLoading("attendance", false);
    }
  }, [data.students, data.selectedBatchData]);

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
  }, [data.selectedBatchData]);

  // Fetch attendance when needed for specific tabs
  useEffect(() => {
    const needsAttendance = [
      "attendance",
      "progress-card",
      "leave-record",
      "job-evaluation",
    ].includes(activeTab);
    if (
      data.students &&
      selectedBatch &&
      needsAttendance &&
      !loadingStates.attendance &&
      data.attendanceStats === null
    ) {
      fetchStudentsAttendance();
    }
  }, [
    data.students,
    activeTab,
    selectedBatch,
    data.attendanceStats?.length,
    // loadingStates.attendance,
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
          ].includes(activeTab) &&
            loadingStates.attendance);

    if (isContentLoading) {
      return <LoadingState size={40} />;
    }

    switch (activeTab) {
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
          <Assignment
            studentProfiles={
              data.students?.filter((item) => item.role?.includes("Student")) ||
              []
            }
            batchData={data.selectedBatchData}
            students={data.students}
          />
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-sm text-black dark:text-white dark:bg-gray-900">
      {data.selectedBatchData && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto dark:bg-gray-800 dark:border dark:border-gray-700">
          <TabNavigation
            tabs={TABS}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            className="dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      {loadingStates.batchData && (
        <LoadingState
          size={50}
          fullPage
          className="dark:bg-gray-900 dark:text-white"
        />
      )}

      {!loadingStates.batchData && !data.selectedBatchData && (
        <EmptyState
          icon={Users}
          title="Please select a batch to view details"
          description="No batch data currently available"
          className="dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700"
        />
      )}

      {!loadingStates.batchData && data.selectedBatchData && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden  dark:bg-gray-900 dark:border dark:border-gray-700 dark:text-white">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default ViewBatch;
