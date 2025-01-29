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

const BatchForm = ({ onClose }) => {
  const [collegesData, setCollegesData] = useState([]);
  const [tradesData, setTradesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchDataLoading, setIsBatchDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [allBatches, setAllBatches] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchData, setBatchData] = useState(null);

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const { register, handleSubmit, setValue, reset } = useForm();
  const navigate = useNavigate();

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
        studentIds: data.studentIds
          ? data.studentIds.split(",").map((id) => id.trim())
          : [],
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
    <div className="max-w-3xl mx-auto p-4 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center mt-6">
        {selectedBatchId ? "Edit Batch" : "Create New Batch"}
      </h1>
      <div className="flex flex-wrap gap-4 mb-4 p-2 justify-center items-center">
        <select
          onChange={handleBatchSelect}
          value={selectedBatchId}
          className="border border-gray-300 rounded-md py-2 px-3"
        >
          <option value="">Select Batch</option>
          {allBatches?.map((item) => (
            <option key={item.$id} value={item.$id}>
              {item.BatchName}
            </option>
          ))}
        </select>
        {selectedBatchId && (
          <button
            onClick={handleDeselectBatch}
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
          >
            Deselect Batch
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit(handleBatchSubmit)}
        className="space-y-6 px-10"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-gray-600">Batch Name</label>
            <input
              type="text"
              {...register("BatchName", { required: "Batch name is required" })}
              placeholder="Enter batch name"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
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
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              disabled={isBatchDataLoading}
            />
          </div>
          <div>
            <label className="block text-gray-600">End Date</label>
            <input
              type="date"
              {...register("end_date", { required: "End date is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              disabled={isBatchDataLoading}
            />
          </div>
          <div>
            <label className="block text-gray-600">College</label>
            <select
              {...register("collegeId", { required: "College is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
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
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
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
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
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
