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
  ChevronDown,
} from "lucide-react";

import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import batchService from "@/appwrite/batchService";

import Loader from "@/components/components/Loader";
import IncompleteProfileGuard from "./components/IncompleteProfileGuard";
import BasicInfoCard from "./components/BasicInfoCard";
import ScheduleSettingsCard from "./components/ScheduleSettingsCard";
import AttendanceLocationCard from "./components/AttendanceLocationCard";

const CreateBatch = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchDataLoading, setIsBatchDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const batchPayload = {
        BatchName: data.BatchName,
        start_date: data.start_date,
        end_date: data.end_date,
        collegeId: data.collegeId,
        tradeId: data.tradeId,
        teacherId: profile.userId,
        teacherName: profile.userName,
        isActive: data.isActive,
        circleRadius: parseInt(data.circleRadius),
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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {selectedBatchId ? (
                  <>
                    <Edit className="text-blue-600" size={24} />
                    Edit Batch
                  </>
                ) : (
                  <>
                    <Plus className="text-blue-600" size={24} />
                    Create New Batch
                  </>
                )}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your batch details, schedule, and attendance settings
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  id="batch-select"
                  onChange={handleBatchSelect}
                  value={selectedBatchId}
                  className="block w-full pl-10 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-colors appearance-none"
                >
                  <option value="">Select Batch to Edit</option>
                  {allBatches?.map((item) => (
                    <option key={item.$id} value={item.$id}>
                      {item.BatchName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {selectedBatchId && (
                <button
                  onClick={handleDeselectBatch}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                  title="Cancel Edit"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
