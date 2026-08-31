import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";
import {
  Users,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  PlusCircle,
  ChevronDown,
  Sparkles,
  Layers
} from "lucide-react";

import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import batchService from "@/services/batch/batchService";

import Loader from "@/components/components/Loader";
import IncompleteProfileGuard from "../components/IncompleteProfileGuard";
import BasicInfoCard from "../components/BasicInfoCard";
import ScheduleSettingsCard from "../components/ScheduleSettingsCard";
import AttendanceLocationCard from "../components/AttendanceLocationCard";
import ScheduleSessionsCard from "../components/ScheduleSessionsCard";
import { normalizeBatchSessions } from "../util/batchSessionUtil";

const CreateBatch = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchDataLoading, setIsBatchDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessions, setSessions] = useState([]);

  const [showMaps, setShowMaps] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [allBatches, setAllBatches] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchData, setBatchData] = useState(null);

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const navigate = useNavigate();

  // Fetch colleges and trades via RTK Query
  const { data: collegesResponse } = useListCollegesQuery();
  const collegesData = collegesResponse?.documents || [];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const selectedCollegeId = watch("collegeId");
  const canMarkAttendance = watch("canMarkAttendance");
  const selectedCollege = collegesData.find((c) => c.$id === selectedCollegeId);
  const tradeIds = selectedCollege?.tradeIds || [];

  // When canMarkAttendance is disabled, also disable canMarkPrevious
  useEffect(() => {
    if (!canMarkAttendance) {
      setValue("canMarkPrevious", false);
    }
  }, [canMarkAttendance, setValue]);

  const { data: tradesResponse } = useListTradesQuery(
    [Query.equal("$id", tradeIds)],
    { skip: !tradeIds.length }
  );
  const tradesData = tradesResponse?.documents || [];

  // Fetch location from browser
  const handleGetLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("location", {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationLoading(false);
        toast.success("Location captured successfully");
      },
      (error) => {
        toast.error("Unable to retrieve your location");
        setLocationLoading(false);
      }
    );
  };

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const data = await batchService.listBatches([
        Query.equal("teacherId", profile.userId),
      ]);
      setAllBatches(data.documents);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatchData = async (batchId) => {
    setIsBatchDataLoading(true);
    try {
      const data = await batchService.getBatch(batchId);
      if (data.teacherId !== profile.userId) {
        toast.error("You are not authorized to access this batch");
        navigate("/arena");
        return;
      }
      setBatchData(data);
      setSessions(normalizeBatchSessions(data));
      setValue("BatchName", data.BatchName);
      setValue("start_date", data.start_date?.split("T")[0] || data.start_date);
      setValue("end_date", data.end_date?.split("T")[0] || data.end_date);
      setValue("collegeId", data.collegeId?.$id || data.collegeId);
      setValue("tradeId", data.tradeId?.$id || data.tradeId);
      setValue("isActive", data.isActive ?? false);

      setValue("canMarkAttendance", data.canMarkAttendance ?? true);
      setValue("attendanceTime", {
        start: data.attendanceTime?.start || "",
        end: data.attendanceTime?.end || "",
      });
      setValue("location", data.location || { lat: "", lon: "" });
      setValue("canMarkPrevious", data.canMarkPrevious ?? false);
      setValue("circleRadius", data.circleRadius || 1000);
    } catch (error) {
      console.error("Error fetching batch data:", error);
      toast.error("Failed to load batch data");
    } finally {
      setIsBatchDataLoading(false);
    }
  };

  // Rehydrate tradeId securely once the trade options arrive
  useEffect(() => {
    if (batchData && tradesData?.length > 0) {
      const originalCollegeId = batchData.collegeId?.$id || batchData.collegeId;
      const originalTradeId = batchData.tradeId?.$id || batchData.tradeId;
      
      if (selectedCollegeId === originalCollegeId && originalTradeId) {
        setValue("tradeId", originalTradeId);
      }
    }
  }, [tradesData, batchData, selectedCollegeId, setValue]);

  useEffect(() => {
    if (profile) {
      fetchBatches();
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (selectedBatchId && user.labels.includes("Teacher")) {
      fetchBatchData(selectedBatchId);
    }
  }, [selectedBatchId]);

  const handleBatchSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Calculate overall start_date and end_date from sessions if available
      const validSessionStarts = sessions.map((s) => s.startDate).filter(Boolean);
      const validSessionEnds = sessions.map((s) => s.endDate).filter(Boolean);
      const earliestStart = validSessionStarts.length > 0 ? validSessionStarts.sort()[0] : data.start_date;
      const latestEnd = validSessionEnds.length > 0 ? validSessionEnds.sort().reverse()[0] : data.end_date;

      const batchPayload = {
        BatchName: data.BatchName,
        start_date: earliestStart,
        end_date: latestEnd,
        collegeId: data.collegeId,
        tradeId: data.tradeId,
        teacherId: profile.userId,
        teacherName: profile.userName,
        isActive: data.isActive,
        circleRadius: parseInt(data.circleRadius),
        sessions: JSON.stringify(sessions),
        attendanceTime: JSON.stringify({
          start: data.attendanceTime.start,
          end: data.attendanceTime.end,
        }),
        location: JSON.stringify(data.location),
        canMarkAttendance: data.canMarkAttendance ?? true,
        canMarkPrevious: data.canMarkPrevious,
        isCurrentBatch: data.isCurrentBatch ?? true,
      };

      if (selectedBatchId) {
        const updatedBatch = await batchService.updateBatch(
          selectedBatchId,
          batchPayload
        );
        setAllBatches((prev) =>
          prev.map((item) => (item.$id === updatedBatch.$id ? updatedBatch : item))
        );
        toast.success("Batch updated successfully!");
      } else {
        const createdBatch = await batchService.createBatch(batchPayload);
        setAllBatches((prev) => [...prev, createdBatch]);
        toast.success("Batch created successfully!");
        
        reset();

        if (allBatches.length === 0) {
          navigate("/manage-batch/view");
        }
      }
    } catch (error) {
      console.error("Error submitting batch:", error);
      toast.error(
        `Failed to ${
          selectedBatchId ? "update" : "create"
        } batch. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchSelect = (e) => {
    setSelectedBatchId(e.target.value);
  };

  const handleDeselectBatch = () => {
    setSelectedBatchId("");
    reset();
  };

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

  // Guard for incomplete teacher profiles
  const missingFields = [];
  if (!profile?.isProfileComplete) missingFields.push("Finalizing Setup");

  if (missingFields.length > 0) {
    return <IncompleteProfileGuard missingFields={missingFields} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-slate-100">
      {/* Redesigned Glassmorphic Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-blue-400/30 dark:border-indigo-500/20 mb-3 mx-2 sm:mx-4 mt-2">
        {/* Ambient background glow orbs */}
        <div className="absolute top-[-70px] right-[-50px] w-[220px] h-[220px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[180px] h-[180px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 dark:bg-indigo-500/30 backdrop-blur-md border border-white/30 dark:border-indigo-400/30 flex items-center justify-center shadow-md shrink-0">
              <PlusCircle className="h-6 w-6 text-white dark:text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white dark:bg-indigo-500/20 dark:text-indigo-300 border border-white/30 dark:border-indigo-500/30">
                  <Sparkles className="w-3 h-3 text-amber-300 dark:text-indigo-400" />
                  BATCH CREATION ENGINE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
                Create New Batch
              </h1>
              <p className="text-xs text-blue-100/90 dark:text-indigo-200/80 font-medium">
                Configure academic schedule, attendance rules & geofence radius
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => navigate("/manage-batch/edit")}
              className="px-3.5 py-2 text-xs font-black bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer border border-amber-300"
            >
              <Edit className="w-4 h-4 text-amber-950" />
              <span>Edit Existing Batch</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/manage-batch/view")}
              className="px-3.5 py-2 text-xs font-extrabold bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-white/25 backdrop-blur-md"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>View All Batches</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3">
        <form onSubmit={handleSubmit(handleBatchSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BasicInfoCard
              register={register}
              collegesData={collegesData}
              tradesData={tradesData}
              isBatchDataLoading={isBatchDataLoading}
            />

            <ScheduleSettingsCard
              register={register}
              canMarkAttendance={canMarkAttendance}
              isBatchDataLoading={isBatchDataLoading}
            />

            <AttendanceLocationCard
              register={register}
              watch={watch}
              setValue={setValue}
              batchData={batchData}
              showMaps={showMaps}
              setShowMaps={setShowMaps}
              locationLoading={locationLoading}
              handleGetLocation={handleGetLocation}
            />
          </div>

          <ScheduleSessionsCard
            sessions={sessions}
            setSessions={setSessions}
          />

          {/* Submit Button */}
          <div className="sticky bottom-6 z-20">
            <button
              type="submit"
              className="w-full bg-blue-600 dark:bg-blue-600 text-white py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 dark:hover:bg-blue-700 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center font-semibold text-lg disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99] cursor-pointer"
              disabled={isSubmitting || isBatchDataLoading}
            >
              {isSubmitting ? (
                <>
                  <ClipLoader size={20} color="#fff" className="mr-3" />
                  {selectedBatchId ? "Updating Batch..." : "Creating Batch..."}
                </>
              ) : (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  {selectedBatchId ? "Update Batch" : "Create Batch"}
                </>
              )}
            </button>
          </div>
        </form>

        {!selectedBatchId && (
          <div className="mt-8 text-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Need to update your personal profile or academic details?
            </p>
            <button
              onClick={() => navigate("/profile/edit")}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
            >
              Go to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBatch;
