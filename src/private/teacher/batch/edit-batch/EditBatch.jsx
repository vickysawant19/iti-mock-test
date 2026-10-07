import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Query } from "appwrite";
import {
  CheckCircle,
  ChevronDown,
  Eye,
  Settings,
  Info,
  CalendarDays,
  MapPin,
  Layers,
  CircleHelp,
} from "lucide-react";

import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import batchService from "@/services/batch/batchService";

import Loader from "@/components/components/Loader";
import IncompleteProfileGuard from "../components/IncompleteProfileGuard";
import BatchFormFields from "../components/BatchFormFields";
import BatchWorkspaceHeader from "../components/BatchWorkspaceHeader";
import SelectedBatchDetailsCard from "../components/SelectedBatchDetailsCard";
import { normalizeBatchSessions } from "../util/batchSessionUtil";

const EditBatch = () => {
  const { batchId: urlBatchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isBatchDataLoading, setIsBatchDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState("form"); // "form" | "details"

  const [sessions, setSessions] = useState([]);
  const [savedSessions, setSavedSessions] = useState([]);
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
    formState: { isDirty },
  } = useForm();

  const selectedCollegeId = watch("collegeId");
  const canMarkAttendance = watch("canMarkAttendance");
  const hasSessionChanges = useMemo(
    () => JSON.stringify(sessions) !== JSON.stringify(savedSessions),
    [sessions, savedSessions]
  );
  const hasChanges = isDirty || hasSessionChanges;
  const selectedCollege = collegesData.find((c) => c.$id === selectedCollegeId);
  const tradeIds = selectedCollege?.tradeIds || [];

  useEffect(() => {
    if (!hasChanges) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    if (!hasChanges) return undefined;

    const handleLinkNavigation = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === location.pathname) return;

      if (!window.confirm("You have unsaved batch changes. Leave this page and discard them?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", handleLinkNavigation, true);
    return () => document.removeEventListener("click", handleLinkNavigation, true);
  }, [hasChanges, location.pathname]);

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
        }, { shouldDirty: true, shouldTouch: true });
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
      const normalizedSessions = normalizeBatchSessions(data);
      setSessions(normalizedSessions);
      setSavedSessions(normalizedSessions);
      reset({
        BatchName: data.BatchName,
        start_date: data.start_date?.split("T")[0] || data.start_date,
        end_date: data.end_date?.split("T")[0] || data.end_date,
        collegeId: data.collegeId?.$id || data.collegeId,
        tradeId: data.tradeId?.$id || data.tradeId,
        isActive: data.isActive ?? false,
        canMarkAttendance: data.canMarkAttendance ?? true,
        attendanceTime: {
        start: data.attendanceTime?.start || "",
        end: data.attendanceTime?.end || "",
        },
        location: data.location || { lat: "", lon: "" },
        canMarkPrevious: data.canMarkPrevious ?? false,
        circleRadius: data.circleRadius || 1000,
      });
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

  const handleSelectedBatchChange = (batchId) => {
    if (hasChanges && !window.confirm("You have unsaved batch changes. Switch batches and discard them?")) return;
    setSelectedBatchId(batchId);
    if (urlBatchId && batchId) {
      navigate(`/batches/${batchId}/settings`, { replace: true });
    }
  };

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
      reset(formData);
      setSavedSessions(sessions);
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
      <BatchWorkspaceHeader
        title="Edit a batch"
        description="Choose a batch to update its schedule, attendance, or location."
        toolbar={(
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label htmlFor="edit-batch-select" className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 sm:w-[min(100%,24rem)]">
              <span>Selected batch</span>
              <span className="relative block">
                <select
                  id="edit-batch-select"
                  onChange={(e) => handleSelectedBatchChange(e.target.value)}
                  value={selectedBatchId}
                  className="h-10 w-full appearance-none truncate rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-slate-800 outline-none transition-shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Select a batch to edit</option>
                  {allBatches?.map((item) => (
                    <option key={item.$id} value={item.$id}>
                      {item.BatchName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </span>
            </label>

            <div role="group" aria-label="Batch mode" className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950 sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveViewMode("form")}
                aria-pressed={activeViewMode === "form"}
                className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors sm:flex-none ${activeViewMode === "form" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
              >
                <Settings className="h-3.5 w-3.5" />
                Edit mode
              </button>
              <button
                type="button"
                onClick={() => {
                  if (hasChanges && !window.confirm("You have unsaved batch changes. Switch to view mode and discard them?")) return;
                  if (hasChanges) {
                    reset();
                    setSessions(savedSessions);
                  }
                  setActiveViewMode("details");
                }}
                aria-pressed={activeViewMode === "details"}
                className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors sm:flex-none ${activeViewMode === "details" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
              >
                <Eye className="h-3.5 w-3.5" />
                View mode
              </button>
            </div>
          </div>
        )}
      />

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
        {activeViewMode === "details" ? (
          <SelectedBatchDetailsCard
            batchData={batchData}
            collegeData={selectedCollegeObj}
            tradeData={selectedTradeObj}
            onEditClick={() => setActiveViewMode("form")}
          />
        ) : (
          <form onSubmit={handleSubmit(handleBatchSubmit)}>
            <nav aria-label="Edit batch sections" className="mb-4 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
              {[
                ["batch-information", "Details"],
                ["batch-schedule", "Schedule"],
                ["attendance-location", "Attendance"],
                ["academic-sessions", "Sessions"],
              ].map(([sectionId, label]) => (
                <a key={sectionId} href={`#${sectionId}`} className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                  {label}
                </a>
              ))}
            </nav>

            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <aside className="hidden lg:block">
                <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">On this page</p>
                  <nav aria-label="Edit batch sections" className="space-y-1">
                    {[
                      ["batch-information", "Batch information", Info],
                      ["batch-schedule", "Schedule & status", CalendarDays],
                      ["attendance-location", "Attendance & location", MapPin],
                      ["academic-sessions", "Academic sessions", Layers],
                    ].map(([sectionId, label, Icon]) => (
                      <a key={sectionId} href={`#${sectionId}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
                        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{label}</span>
                      </a>
                    ))}
                  </nav>
                  <div className="mt-4 border-t border-slate-100 px-3 pt-3 dark:border-slate-800">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400"><CircleHelp className="h-3.5 w-3.5" /> Changes save when you choose Save changes.</p>
                  </div>
                </div>
              </aside>

              <div className="min-w-0">
                <BatchFormFields
                  register={register}
                  collegesData={collegesData}
                  tradesData={tradesData}
                  canMarkAttendance={canMarkAttendance}
                  isBatchDataLoading={isBatchDataLoading}
                  watch={watch}
                  setValue={setValue}
                  batchData={batchData}
                  showMaps={showMaps}
                  setShowMaps={setShowMaps}
                  locationLoading={locationLoading}
                  handleGetLocation={handleGetLocation}
                  sessions={sessions}
                  setSessions={setSessions}
                />
              </div>
            </div>

            {/* Keep save action visible only while there are unsaved changes. */}
            {hasChanges && <div className="sticky bottom-4 z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:bottom-6 sm:px-4">
              <div className="hidden min-w-0 sm:block">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Unsaved changes</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Save your updates to apply them to this batch.</p>
              </div>
              <button
                type="submit"
                className="ml-auto inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900 sm:w-auto"
                disabled={isSubmitting || isBatchDataLoading || !selectedBatchId}
              >
                {isSubmitting ? (
                  <>
                    <ClipLoader size={20} color="#fff" className="mr-3" />
                    Updating Batch...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Save changes
                  </>
                )}
              </button>
            </div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default EditBatch;
