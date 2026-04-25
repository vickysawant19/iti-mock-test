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
  Loader2,
} from "lucide-react";
import { useGetTradeQuery } from "@/store/api/tradeApi";
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
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";

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
  const { activeBatchId, userBatches, isLoading: batchesLoading } = useSelector((state) => state.activeBatch);
  const [loadingStates, setLoadingStates] = useState({
    batchData: false,
    students: false,
    attendance: false,
  });
  const [data, setData] = useState({
    selectedBatchData: null,
    students: null,
  });
  const [selectedBatch, setSelectedBatch] = useState(
    searchParams.get("batchid") || activeBatchId || ""
  );

  // Sync selectedBatch from search params 
  useEffect(() => {
    if (searchParams.get("batchid")) {
      setSelectedBatch(searchParams.get("batchid"));
    } else if (activeBatchId) {
      setSelectedBatch(activeBatchId);
    }
  }, [searchParams.get("batchid"), activeBatchId]);
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
        Query.limit(100)
      ]);

      // 3. Merge batch-specific enrollment info (rollNumber, stats, etc.)
      const memberMap = {};
      batchMembers.forEach(m => { memberMap[m.studentId] = m; });

      const enrichedStudents = result.map(profile => {
        const member = memberMap[profile.userId] || {};
        return {
          ...profile,
          studentId: member.rollNumber || "NA", // mapping rollNumber to studentId for component compat
          registerId: member.registerId || "NA",
          status: member.status || "Inactive", // use batch-specific status
          enrolledAt: member.enrollmentDate || member.joinedAt || "N/A",
        };
      });

      // Sort by rollNumber
      const sortedStudents = enrichedStudents.sort((a, b) => {
        const numA = parseInt(a.studentId) || 999;
        const numB = parseInt(b.studentId) || 999;
        return numA - numB;
      });

      setData((prev) => ({ ...prev, students: sortedStudents }));
    } catch (error) {
      console.error("Error fetching batch students:", error);
      setData((prev) => ({ ...prev, students: [] }));
    } finally {
      setLoading("students", false);
      fetchedStudentsRef.current = true;
    }
  }, [data.selectedBatchData]);

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

  // Render content based on active tab
  const renderContent = () => {
    const isContentLoading = loadingStates.students;

    if (isContentLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading {activeTab} data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "profiles":
        return <ViewProfiles students={data.students} batchId={selectedBatch} />;
      case "attendance":
        return (
          <ViewAttendance
            students={data.students}
            batchData={data.selectedBatchData}
          />
        );
      case "progress-card":
        return (
          <ProgressCard
            studentProfiles={data.students}
            batchData={data.selectedBatchData}
            setBatchData={(newData) =>
              setData((prev) => ({ ...prev, selectedBatchData: newData }))
            }
          />
        );
      case "leave-record":
        return (
          <TraineeLeaveRecord
            studentProfiles={data.students}
            batchData={data.selectedBatchData}
          />
        );
      case "job-evaluation":
        return (
          <JobEvaluation
            studentProfiles={
              data.students?.filter((item) => item.role?.includes("Student")) || []
            }
            stats={data.attendanceStats}
            batchData={data.selectedBatchData}
          />
        );
      case "assignments":
        return (
          <Assignment
            studentProfiles={
              data.students?.filter((item) => item.role?.includes("Student")) || []
            }
            batchData={data.selectedBatchData}
            students={data.students}
          />
        );
      case "achievements":
        return <FeaturePlaceholder icon={Award} title="Achievements Coming Soon" />;
      default:
        return null;
    }
  };


  const { data: tradeData } = useGetTradeQuery(
    data.selectedBatchData?.tradeId,
    { skip: !data.selectedBatchData?.tradeId }
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Batch Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-2xl shrink-0">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                  {data.selectedBatchData?.BatchName || "Batch Details"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {tradeData?.tradeName && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 px-2.5 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      {tradeData.tradeName}
                    </span>
                  )}
                  {data.selectedBatchData?.Year && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 px-2.5 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3" />
                      {data.selectedBatchData.Year}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Student Count */}
            {data.selectedBatchData && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Enrolled</p>
                  <p className="text-xl font-black text-blue-700 dark:text-blue-300 leading-none">{data.students?.length || 0}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          {data.selectedBatchData && (
            <div className="mt-4">
              <TabNavigation
                tabs={TABS}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          )}
        </div>
      </div>

      <div className={`${activeTab === "attendance" ? "w-full px-2 sm:px-4 lg:px-8" : "container mx-auto px-4 sm:px-6 lg:px-8"} mt-8`}>
        {loadingStates.batchData && (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-xl font-bold text-gray-900 dark:text-white">Loading dashboard...</p>
          </div>
        )}

        {!loadingStates.batchData && !data.selectedBatchData && (
          <div className="max-w-xl mx-auto mt-20">
            {(!batchesLoading && userBatches?.length === 0) ? (
              <div className="-mt-20">
                <NoBatchTeacherView isTeacher={true} />
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="Welcome Teacher"
                description="Please select a batch from your dashboard or sidebar to view detailed student analytics and records."
                className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 rounded-3xl"
              />
            )}
          </div>
        )}

        {!loadingStates.batchData && data.selectedBatchData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewBatch;
