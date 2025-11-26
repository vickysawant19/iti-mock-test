import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";
import {
  Users,
  Building,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Map as MapIcon,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Settings,
  Locate,
  ChevronDown,
} from "lucide-react";

import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import batchService from "@/appwrite/batchService";

import LocationPicker from "../components/LocationPicker";
import Loader from "@/components/components/Loader";

const BatchForm = ({ onClose }) => {
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

  // Fetch colleges and trades via RTK Query
  const { data: collegesResponse } = useListCollegesQuery();
  const collegesData = collegesResponse?.documents || [];
  const { data: tradesResponse } = useListTradesQuery();
  const tradesData = tradesResponse?.documents || [];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
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
        navigate("/dash");
        return;
      }
      setBatchData(data);
      setValue("BatchName", data.BatchName);
      setValue("start_date", data.start_date?.split("T")[0] || data.start_date);
      setValue("end_date", data.end_date?.split("T")[0] || data.end_date);
      setValue("collegeId", data.collegeId);
      setValue("tradeId", data.tradeId);
      setValue("isActive", data.isActive ?? false);
      setValue(
        "studentIds",
        Array.isArray(data.studentIds)
          ? data.studentIds.join(", ")
          : data.studentIds
      );

      setValue("canEditAttendance", data.canEditAttendance ?? false);
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
        // canEditAttendance: data.canEditAttendance,
        attendanceTime: JSON.stringify({
          start: data.attendanceTime.start,
          end: data.attendanceTime.end,
        }),
        location: JSON.stringify(data.location),
        canMarkPrevious: data.canMarkPrevious,
      };

      if (selectedBatchId) {
        const data = await batchService.updateBatch(
          selectedBatchId,
          batchPayload
        );
        setAllBatches((prev) =>
          prev.map((item) => (item.$id === data.$id ? data : item))
        );
        toast.success("Batch updated successfully!");
      } else {
        const data = await batchService.createBatch(batchPayload);
        setAllBatches((prev) => [...prev, data]);
        toast.success("Batch created successfully!");
        reset();
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
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
            {/* Card 1: Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-fit">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users
                    className="text-blue-600 dark:text-blue-400"
                    size={20}
                  />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Basic Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Batch Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register("BatchName", {
                        required: "Batch name is required",
                      })}
                      placeholder="e.g. 2023-2025 Electrician Batch A"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 transition-all sm:text-sm"
                      disabled={isBatchDataLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    College <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      {...register("collegeId", {
                        required: "College is required",
                      })}
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all sm:text-sm appearance-none"
                      disabled={isBatchDataLoading}
                    >
                      <option value="">Select College</option>
                      {collegesData.map((college) => (
                        <option key={college.$id} value={college.$id}>
                          {college.collageName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Trade <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BookOpen className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      {...register("tradeId", {
                        required: "Trade is required",
                      })}
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all sm:text-sm appearance-none"
                      disabled={isBatchDataLoading}
                    >
                      <option value="">Select Trade</option>
                      {tradesData.map((trade) => (
                        <option key={trade.$id} value={trade.$id}>
                          {trade.tradeName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Schedule & Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-fit">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calendar
                    className="text-purple-600 dark:text-purple-400"
                    size={20}
                  />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Schedule & Settings
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        {...register("start_date", {
                          required: "Start date is required",
                        })}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all sm:text-sm"
                        disabled={isBatchDataLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        {...register("end_date", {
                          required: "End date is required",
                        })}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all sm:text-sm"
                        disabled={isBatchDataLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Batch Active Status
                    </span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("isActive")}
                        className="sr-only peer"
                        disabled={isBatchDataLoading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Allow Previous Attendance
                    </span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("canMarkPrevious")}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Card 3: Attendance & Location (Full Width) */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <MapPin
                    className="text-amber-600 dark:text-amber-400"
                    size={20}
                  />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Attendance & Location
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Attendance Time */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock size={16} className="text-gray-500" />
                      Attendance Timing
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          {...register("attendanceTime.start", {})}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          {...register("attendanceTime.end", {})}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Radius */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Navigation size={16} className="text-gray-500" />
                        Attendance Radius
                      </h3>
                      <span className="text-xs font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                        {watch("circleRadius")}m
                      </span>
                    </div>
                    <div className="pt-2">
                      <input
                        type="range"
                        min={10}
                        max={1000}
                        {...register("circleRadius", {})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Allowed distance from center (10m - 1000m)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <MapIcon size={16} className="text-gray-500" />
                      Location Coordinates
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowMaps((prev) => !prev)}
                      className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        showMaps
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {showMaps ? "Hide Map" : "Show Map"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Navigation className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={watch("location.lat") || ""}
                        placeholder="Latitude"
                        className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm"
                        disabled
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Navigation className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={watch("location.lon") || ""}
                        placeholder="Longitude"
                        className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm"
                        disabled
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <ClipLoader size={16} color="currentColor" />
                      ) : (
                        <>
                          <Locate size={16} />
                          Get Current Location
                        </>
                      )}
                    </button>
                  </div>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${
                      showMaps ? "h-80 opacity-100" : "h-0 opacity-0 border-0"
                    }`}
                  >
                    {showMaps && (
                      <LocationPicker
                        batchLocation={batchData?.location || undefined}
                        deviceLocation={watch("location")}
                        setValue={setValue}
                        circleRadius={watch("circleRadius")}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-6 z-20">
            <button
              type="submit"
              className="w-full bg-blue-600 dark:bg-blue-600 text-white py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 dark:hover:bg-blue-700 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center font-semibold text-lg disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              Go to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchForm;
