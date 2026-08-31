import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { Query } from "appwrite";
import {
  Edit,
  CheckCircle,
  Users,
  ChevronDown,
  ArrowLeft,
  Eye,
  Settings,
  Sparkles
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
import SelectedBatchDetailsCard from "../components/SelectedBatchDetailsCard";
import { normalizeBatchSessions } from "../util/batchSessionUtil";

const EditBatch = () => {
  const { batchId: urlBatchId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isBatchDataLoading, setIsBatchDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState("form"); // "form" | "details"

  const [sessions, setSessions] = useState([]);
  const [showMaps, setShowMaps] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [allBatches, setAllBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(urlBatchId || "");
  const [batchData, setBatchData] = useState(null);

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const { data: collegesResponse } = useListCollegesQuery();
  const collegesData = collegesResponse?.documents || [];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
  } = useForm();

  const selectedCollegeId = watch("collegeId");
  const canMarkAttendance = watch("canMarkAttendance");
  const selectedCollege = collegesData.find((c) => c.$id === selectedCollegeId);
  const tradeIds = selectedCollege?.tradeIds || [];

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
      setAllBatches(data.documents || []);
      if (!selectedBatchId && data.documents?.length > 0) {
        setSelectedBatchId(data.documents[0].$id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatchData = async (batchId) => {
    if (!batchId) return;
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
    }
  }, [profile]);

  useEffect(() => {
    if (urlBatchId) {
      setSelectedBatchId(urlBatchId);
    }
  }, [urlBatchId]);

  useEffect(() => {
    if (selectedBatchId && user?.labels?.includes("Teacher")) {
      fetchBatchData(selectedBatchId);
    }
  }, [selectedBatchId]);

  const handleBatchSubmit = async (formData) => {
    if (!selectedBatchId) return;
    setIsSubmitting(true);
    try {
      const validSessionStarts = sessions.map((s) => s.startDate).filter(Boolean);
      const validSessionEnds = sessions.map((s) => s.endDate).filter(Boolean);
      const earliestStart = validSessionStarts.length > 0 ? validSessionStarts.sort()[0] : formData.start_date;
      const latestEnd = validSessionEnds.length > 0 ? validSessionEnds.sort().reverse()[0] : formData.end_date;

      const batchPayload = {
        BatchName: formData.BatchName,
        start_date: earliestStart,
        end_date: latestEnd,
        collegeId: formData.collegeId,
        tradeId: formData.tradeId,
        teacherId: profile.userId,
        teacherName: profile.userName,
        isActive: formData.isActive,
        circleRadius: parseInt(formData.circleRadius),
        sessions: JSON.stringify(sessions),
        attendanceTime: JSON.stringify({
          start: formData.attendanceTime.start,
          end: formData.attendanceTime.end,
        }),
        location: JSON.stringify(formData.location),
        canMarkAttendance: formData.canMarkAttendance ?? true,
        canMarkPrevious: formData.canMarkPrevious,
        isCurrentBatch: formData.isCurrentBatch ?? true,
      };

      const updatedBatch = await batchService.updateBatch(selectedBatchId, batchPayload);
      setAllBatches((prev) =>
        prev.map((item) => (item.$id === updatedBatch.$id ? updatedBatch : item))
      );
      setBatchData(updatedBatch);
      toast.success("Batch updated successfully!");
    } catch (error) {
      console.error("Error updating batch:", error);
      toast.error("Failed to update batch. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loader isLoading={isLoading} />;

  const missingFields = [];
  if (!profile?.isProfileComplete) missingFields.push("Finalizing Setup");
  if (missingFields.length > 0) return <IncompleteProfileGuard missingFields={missingFields} />;

  const selectedCollegeObj = collegesData.find(c => c.$id === (batchData?.collegeId?.$id || batchData?.collegeId));
  const selectedTradeObj = tradesData.find(t => t.$id === (batchData?.tradeId?.$id || batchData?.tradeId));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-slate-100">
      {/* Redesigned Glassmorphic Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-blue-400/30 dark:border-indigo-500/20 mb-3 mx-2 sm:mx-4 mt-2">
        {/* Ambient background glow orbs */}
        <div className="absolute top-[-70px] right-[-50px] w-[220px] h-[220px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[180px] h-[180px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          {/* Top Row: Back Button + Title + Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/manage-batch/view")}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all cursor-pointer shadow-xs border border-white/20"
                title="Back to Batches"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="w-10 h-10 rounded-2xl bg-white/20 dark:bg-indigo-500/30 backdrop-blur-md border border-white/30 dark:border-indigo-400/30 flex items-center justify-center shadow-md shrink-0">
                <Edit className="h-5 w-5 text-white dark:text-indigo-200" />
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white dark:bg-indigo-500/20 dark:text-indigo-300 border border-white/30 dark:border-indigo-500/30">
                    <Sparkles className="w-3 h-3 text-amber-300 dark:text-indigo-400" />
                    BATCH CONFIGURATION
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
                  Edit Batch Settings
                </h1>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-black/20 dark:bg-slate-900/70 p-1 rounded-xl border border-white/20 dark:border-slate-800 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveViewMode("form")}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewMode === "form"
                    ? "bg-white text-indigo-700 dark:bg-indigo-500 dark:text-white shadow-xs"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> Edit Form
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode("details")}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewMode === "details"
                    ? "bg-amber-400 text-amber-950 shadow-xs"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Details Card
              </button>
            </div>

          </div>

          {/* Bottom Row: Batch Selector Bar */}
          <div className="pt-2 border-t border-white/20 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider text-[11px]">
              Active Selection:
            </span>

            <div className="relative w-full sm:w-80">
              <select
                id="edit-batch-select"
                onChange={(e) => setSelectedBatchId(e.target.value)}
                value={selectedBatchId}
                className="w-full px-3 py-1.5 text-xs font-bold bg-white/20 dark:bg-slate-900/80 backdrop-blur-md text-white border border-white/30 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-300 transition-all appearance-none pr-8 cursor-pointer truncate"
              >
                <option value="" className="text-slate-900 dark:text-slate-100">Select Batch to Edit</option>
                {allBatches?.map((item) => (
                  <option key={item.$id} value={item.$id} className="text-slate-900 dark:text-slate-100">
                    {item.BatchName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/80" />
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3">
        {activeViewMode === "details" ? (
          <SelectedBatchDetailsCard
            batchData={batchData}
            collegeData={selectedCollegeObj}
            tradeData={selectedTradeObj}
            onEditClick={() => setActiveViewMode("form")}
          />
        ) : (
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
                className="w-full bg-blue-600 dark:bg-blue-600 text-white py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all duration-200 flex items-center justify-center font-bold text-base disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                disabled={isSubmitting || isBatchDataLoading || !selectedBatchId}
              >
                {isSubmitting ? (
                  <>
                    <ClipLoader size={20} color="#fff" className="mr-3" />
                    Updating Batch...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} className="mr-2" />
                    Update Batch Settings
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditBatch;
