import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";

import collegeService from "../../../../appwrite/collageService";
import tradeservice from "../../../../appwrite/tradedetails";
import { selectProfile } from "../../../../store/profileSlice";
import batchService from "../../../../appwrite/batchService";
import { selectUser } from "../../../../store/userSlice";

import LocationPicker from "../components/LocationPicker";

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
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <ClipLoader color="#123abc" size={50} />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 pb-10">
      <div className="w-full bg-sky-200 p-6 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl font-bold ">
            {selectedBatchId ? "Edit Batch" : "Create New Batch"}
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="batch-select" className="font-medium">
                Edit Existing Batch
              </label>
              <select
                id="batch-select"
                onChange={handleBatchSelect}
                value={selectedBatchId}
                className="border  rounded-md py-2 px-4 min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 h-10 mt-6"
              >
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(handleBatchSubmit)}
        className="space-y-6 px-10  w-full py-10"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 relative ">
          <div>
            <label className="block text-gray-600">Batch Name</label>
            <input
              type="text"
              {...register("BatchName", {
                required: "Batch name is required",
              })}
              placeholder="Enter batch name"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500"
              disabled={isBatchDataLoading}
            />
          </div>
          <div>
            <label className="block text-gray-600">Start Date</label>
            <input
              type="date"
              {...register("start_date", {
                required: "Start date is required",
              })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500"
              disabled={isBatchDataLoading}
            />
          </div>
          <div>
            <label className="block text-gray-600">End Date</label>
            <input
              type="date"
              {...register("end_date", { required: "End date is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500"
              disabled={isBatchDataLoading}
            />
          </div>
          <div>
            <label className="block text-gray-600">College</label>
            <select
              {...register("collegeId", { required: "College is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500"
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
          <div>
            <label className="block text-gray-600">Trade</label>
            <select
              {...register("tradeId", { required: "Trade is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:border-blue-500"
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
          <div>
            <label className="inline-flex items-center cursor-pointer flex-col">
              <span className="ms-3 text-sm font-medium text-gray-600 mb-2">
                Batch Status
              </span>
              <input
                {...register("isActive")}
                disabled={isBatchDataLoading}
                type="checkbox"
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:rtl:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="col-span-full relative">
            <label className="block text-gray-600 mb-2">
              Location
              <span className="text-xs italic text-gray-500 ml-2">
                (Student can mark attendance from 1km range)
              </span>
            </label>
            <div className="flex flex-col lg:flex-row gap-4">
              <input
                type="text"
                value={watch("location.lat") || ""}
                placeholder="Latitude"
                className="flex-1 border border-gray-300 rounded-md py-2 px-3"
                disabled
              />
              <input
                type="text"
                value={watch("location.lon") || ""}
                placeholder="Longitude"
                className="flex-1 border border-gray-300 rounded-md py-2 px-3"
                disabled
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
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
                  className="bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-gray-400"
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
              <label className="block text-gray-600">
                Attendace Circle Radius : {watch("circleRadius")} meter
              </label>

              <input
                type="range"
                min={10}
                max={1000}
                {...register("circleRadius", {})}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-600">Attendance Start Time</label>
            <input
              type="time"
              {...register("attendanceTime.start", {})}
              className="w-full border border-gray-300 rounded-md py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-gray-600">Attendance End Time</label>
            <input
              type="time"
              {...register("attendanceTime.end", {})}
              className="w-full border border-gray-300 rounded-md py-2 px-3"
            />
          </div>
          {/* New Previous Attendance Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="canMarkPrevious"
              type="checkbox"
              {...register("canMarkPrevious")}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded-sm focus:ring-blue-500"
            />
            <label htmlFor="canMarkPrevious" className="text-gray-600">
              Allow Students to mark previous attendance
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
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
          <p className="text-gray-600">
            If you have created a batch, please update the batch in your
            profile.
          </p>
          <button
            onClick={() => navigate("/profile/edit")}
            className="mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
          >
            Update Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default BatchForm;
