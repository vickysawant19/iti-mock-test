import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";

import collegeService from "@/appwrite/collageService";
import tradeservice from "@/appwrite/tradedetails";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import batchService from "@/appwrite/batchService";

import LocationPicker from "../components/LocationPicker";
import Loader from "@/components/components/Loader";

const BatchForm = ({ onClose }) => {
  const [collegesData, setCollegesData] = useState([]);
  const [tradesData, setTradesData] = useState([]);
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

  const fetchData = async () => {
    try {
      const [collegeResponse, tradesResponse] = await Promise.all([
        collegeService.listColleges(),
        tradeservice.listTrades(),
      ]);

      setCollegesData(collegeResponse.documents);
      setTradesData(tradesResponse.documents);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load required data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchBatches();
      fetchData();
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
    <div className="bg-gray-100 pb-10 dark:bg-gray-900">
      <div className="w-full bg-gary-300 p-6 shadow-md dark:bg-gray-800 dark:text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {selectedBatchId ? "Edit Batch" : "Create New Batch"}
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="batch-select"
                className="font-medium text-gray-700 dark:text-gray-300"
              >
                Edit Existing Batch
              </label>
              <select
                id="batch-select"
                onChange={handleBatchSelect}
                value={selectedBatchId}
                className="border rounded-md py-2 px-4 min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">Select Batch</option>
                {allBatches?.map((item) => (
                  <option key={item.$id} value={item.$id}>
                    {item.BatchName}
                  </option>
                ))}
              </select>
            </div>
            {selectedBatchId && (
              <button
                onClick={handleDeselectBatch}
                className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 h-10 mt-6 dark:bg-red-700 dark:hover:bg-red-800"
              >
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(handleBatchSubmit)}
        className="space-y-6 px-10 w-full py-10 dark:bg-gray-900 dark:text-white"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 relative">
          {/* Batch Name */}
          <div>
            <label className="block text-gray-600 dark:text-gray-300">
              Batch Name
            </label>
            <input
              type="text"
              {...register("BatchName", {
                required: "Batch name is required",
              })}
              placeholder="Enter batch name"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              disabled={isBatchDataLoading}
            />
          </div>
          {/* Start Date */}
          <div>
            <label className="block text-gray-600 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              {...register("start_date", {
                required: "Start date is required",
              })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              disabled={isBatchDataLoading}
            />
          </div>
          {/* End Date */}
          <div>
            <label className="block text-gray-600 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              {...register("end_date", { required: "End date is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              disabled={isBatchDataLoading}
            />
          </div>
          {/* College */}
          <div>
            <label className="block text-gray-600 dark:text-gray-300">
              College
            </label>
            <select
              {...register("collegeId", { required: "College is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              disabled={isBatchDataLoading}
            >
              <option value="">Select a college</option>
              {collegesData.map((college) => (
                <option key={college.$id} value={college.$id}>
                  {college.collageName}
                </option>
              ))}
            </select>
          </div>
          {/* Trade */}
          <div>
            <label className="block text-gray-600 dark:text-gray-300">
              Trade
            </label>
            <select
              {...register("tradeId", { required: "Trade is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              disabled={isBatchDataLoading}
            >
              <option value="">Select a trade</option>
              {tradesData.map((trade) => (
                <option key={trade.$id} value={trade.$id}>
                  {trade.tradeName}
                </option>
              ))}
            </select>
          </div>
          {/* Batch Status */}
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              {...register("isActive")}
              disabled={isBatchDataLoading}
              className="w-6 h-6 pt-2 text-blue-600 border-gray-300 rounded-sm focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-blue-800"
            />
            <label htmlFor="isActive" className="text-gray-600 dark:text-gray-300">
              Batch is Active
            </label>
          </div>
          {/* Location */}
          <div className="col-span-full">
            <label className="block text-gray-600 mb-2 dark:text-gray-300">
              Location
              <span className="text-xs italic text-gray-500 ml-2 dark:text-gray-400">
                (Student can mark attendance from 1km range)
              </span>
            </label>
            <div className="flex flex-col lg:flex-row gap-4">
              <input
                type="text"
                value={watch("location.lat") || ""}
                placeholder="Latitude"
                className="flex-1 border border-gray-300 rounded-md py-2 px-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                disabled
              />
              <input
                type="text"
                value={watch("location.lon") || ""}
                placeholder="Longitude"
                className="flex-1 border border-gray-300 rounded-md py-2 px-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                disabled
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800"
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <ClipLoader size={20} color="#fff" />
                  ) : (
                    "Get Location"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaps((prev) => !prev)}
                  className="bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-gray-400 dark:bg-teal-700 dark:hover:bg-teal-800"
                >
                  {locationLoading ? (
                    <ClipLoader size={20} color="#fff" />
                  ) : showMaps ? (
                    "Hide Map"
                  ) : (
                    "Show Map"
                  )}
                </button>
              </div>
            </div>
            <div
              className={`border mt-4 overflow-hidden rounded w-full transition-all ease-in-out duration-300 top-0 z-2 ${
                showMaps ? "h-80" : "h-0"
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
            <div className="mt-5">
              <label className="block text-gray-600 dark:text-gray-300">
                Attendance Circle Radius : {watch("circleRadius")} meter
              </label>
              <input
                type="range"
                min={10}
                max={1000}
                {...register("circleRadius", {})}
                className="w-full border border-gray-300 rounded-md py-2 px-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>
          {/* Attendance Start Time */}
          <div>
            <label className="block text-gray-600 dark:text-gray-300">
              Attendance Start Time
            </label>
            <input
              type="time"
              {...register("attendanceTime.start", {})}
              className="w-full border border-gray-300 rounded-md py-2 px-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          {/* Attendance End Time */}
          <div>
            <label className="block text-gray-600 dark:text-gray-300">
              Attendance End Time
            </label>
            <input
              type="time"
              {...register("attendanceTime.end", {})}
              className="w-full border border-gray-300 rounded-md py-2 px-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          {/* Allow Previous Attendance Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="canMarkPrevious"
              type="checkbox"
              {...register("canMarkPrevious")}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded-sm focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-blue-800"
            />
            <label
              htmlFor="canMarkPrevious"
              className="text-gray-600 dark:text-gray-300"
            >
              Allow Students to mark previous attendance
            </label>
          </div>
        </div>
        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800"
          disabled={isSubmitting || isBatchDataLoading}
        >
          {isSubmitting
            ? selectedBatchId
              ? "Updating..."
              : "Creating..."
            : selectedBatchId
            ? "Update Batch"
            : "Create Batch"}
        </button>
      </form>
      {!selectedBatchId && (
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            If you have created a batch, please update the batch in your
            profile.
          </p>
          <button
            onClick={() => navigate("/profile/edit")}
            className="mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800"
          >
            Update Profile
          </button>
        </div>
      )}
    </div>
  );
  s;
};

export default BatchForm;
