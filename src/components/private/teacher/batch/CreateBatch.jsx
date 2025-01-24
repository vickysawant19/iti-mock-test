import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import collegeService from "../../../../appwrite/collageService";
import tradeservice from "../../../../appwrite/tradedetails";
import { selectProfile } from "../../../../store/profileSlice";
import { useSelector } from "react-redux";
import batchService from "../../../../appwrite/batchService";
import { selectUser } from "../../../../store/userSlice";
import { useNavigate } from "react-router-dom";

const BatchForm = () => {
  const [collegesData, setCollegesData] = useState([]);
  const [tradesData, setTradesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchData, setBatchData] = useState(null);

  const user = useSelector(selectUser);

  const profile = useSelector(selectProfile);
  const isEditing = !!batchData;

  // Initialize form without defaultValues
  const { register, handleSubmit, setValue, reset } = useForm();
  const navigate = useNavigate();

  const fetchBatchData = async () => {
    setIsLoading(true);
    try {
      const data = await batchService.getBatch(profile.batchId);
      if (data.teacherId !== profile.userId) {
        toast.error("You are not authorized to access this batch");
        navigate("/dash");
      }
      setBatchData(data);

      // Set form values after fetching data
      setValue("BatchName", data.BatchName);
      // Handle date formatting for both cases where date might include time
      setValue("start_date", data.start_date?.split("T")[0] || data.start_date);
      setValue("end_date", data.end_date?.split("T")[0] || data.end_date);
      setValue("collegeId", data.collegeId);
      setValue("tradeId", data.tradeId);
      setValue(
        "studentIds",
        Array.isArray(data.studentIds)
          ? data.studentIds.join(", ")
          : data.studentIds
      );
    } catch (error) {
      console.error("Error fetching batch data:", error);
      toast.error("Failed to load batch data");
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
    if (user.labels.includes("Teacher") && profile.batchId) {
      fetchBatchData();
      fetchData();
    } else {
      setIsLoading(false);
      navigate("/dash");
    }
  }, [profile.batchId]);

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
        studentIds: data.studentIds
          ? data.studentIds.split(",").map((id) => id.trim())
          : [],
      };

      if (isEditing) {
        await batchService.updateBatch(batchData.$id, batchPayload);
        toast.success("Batch updated successfully!");
      } else {
        await batchService.createBatch(batchPayload);
        toast.success("Batch created successfully!");
      }

      if (!isEditing) {
        reset();
      }
    } catch (error) {
      console.error("Error submitting batch:", error);
      toast.error(
        `Failed to ${isEditing ? "update" : "create"} batch. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <ClipLoader color="#123abc" size={50} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {isEditing ? "Edit Batch" : "Create New Batch"}
      </h1>
      <form
        onSubmit={handleSubmit(handleBatchSubmit)}
        className="space-y-6 px-10"
      >
        <div>
          <label className="block text-gray-600">Batch Name</label>
          <input
            type="text"
            {...register("BatchName", { required: "Batch name is required" })}
            placeholder="Enter batch name"
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-600">Start Date</label>
          <input
            type="date"
            {...register("start_date", { required: "Start date is required" })}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-600">End Date</label>
          <input
            type="date"
            {...register("end_date", { required: "End date is required" })}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-600">College</label>
          <select
            {...register("collegeId", { required: "College is required" })}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
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
          <label className="block text-gray-600">Student IDs</label>
          <textarea
            {...register("studentIds")}
            placeholder="Enter student IDs separated by commas"
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
            ? "Update Batch"
            : "Create Batch"}
        </button>
      </form>
    </div>
  );
};

export default BatchForm;
