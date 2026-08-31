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
import userProfileService from "@/services/auth/userProfileService";
import batchService from "@/services/batch/batchService";
import batchStudentService from "@/services/batch/batchStudentService";

import BatchHeader from "./components/BatchHeader";
import LoadingState from "./components/LoadingState";
import EmptyState from "./components/EmptyState";
import FeaturePlaceholder from "./components/FeaturePlaceholder";
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";

import ViewProfiles from "./tabs/profiles/ViewProfiles";
import ViewAttendance from "../../../Attendance/ViewAttendance";
import JobEvaluation from "./tabs/job-evaluation/JobEvaluation";
import ProgressCard from "./tabs/progress-cards/ProgressCards";
import TraineeLeaveRecord from "./tabs/leave-records/LeaveRecord";
import Assignment from "./tabs/assignments/Assignment";
import SelectedBatchDetailsCard from "../components/SelectedBatchDetailsCard";
import { Info } from "lucide-react";

const TABS = [
  { id: "details", label: "Batch Details", icon: Info },
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

  // Sync selectedBatch from global activeBatchId or search params
  useEffect(() => {
    if (activeBatchId) {
      setSelectedBatch(activeBatchId);
    } else if (searchParams.get("batchid")) {
      setSelectedBatch(searchParams.get("batchid"));
    }
  }, [activeBatchId, searchParams.get("batchid")]);

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

      const enrichedStudents = result.map(profileItem => {
        const member = memberMap[profileItem.userId] || {};
        return {
          ...profileItem,
          studentId: member.rollNumber || "NA",
          registerId: member.registerId || "NA",
          status: member.status || "Inactive",
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

  // Lazy Tab Content Renderer
  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <SelectedBatchDetailsCard
            batchData={data.selectedBatchData}
            tradeData={tradeData}
            studentCount={data.students?.length}
          />
        );
      case "profiles":
        return (
          <ViewProfiles
            students={data.students}
            batchId={selectedBatch}
            batchData={data.selectedBatchData}
          />
        );
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
            studentProfiles={data.students}
            batchData={data.selectedBatchData}
          />
        );
      case "assignments":
        return (
          <Assignment
            students={data.students}
            batchData={data.selectedBatchData}
          />
        );
      case "achievements":
        return (
          <FeaturePlaceholder
            icon={Award}
            title="Student Achievements"
            description="Badges, certifications, and awards earned by students in this batch will be displayed here."
          />
        );
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
      {/* Dashboard Header Component */}
      <BatchHeader
        selectedBatchData={data.selectedBatchData}
        tradeData={tradeData}
        studentCount={data.students?.length}
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 mt-6">
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
