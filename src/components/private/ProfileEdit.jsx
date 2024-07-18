import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import tradeService from "../../appwrite/tradedetails";
import batchService from "../../appwrite/batchService";
import userProfileService from "../../appwrite/userProfileService";

import { addProfile, selectProfile } from "../../store/profileSlice";
import collegeService from "../../appwrite/collageService";
import { ClipLoader } from "react-spinners";

const EditProfileForm = () => {
  const user = useSelector((state) => state.user);
  const profile = useSelector(selectProfile);

  const [collegesData, setCollegesData] = useState([]);
  const [tradesData, setTradesData] = useState([]);
  const [batchesData, setBatchesData] = useState([]);

  const { register, handleSubmit, watch, setValue, getValues } = useForm();

  const selectedCollegeId = watch("collegeId");
  const selectedTradeId = watch("tradeId");
  const selectedBatchId = watch("batchId");

  const [isLoading, setIsLoading] = useState(true);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  console.log(getValues());

  useEffect(() => {
    setIsLoading(true);
    const fetchColleges = async () => {
      try {
        const collegeData = await collegeService.listColleges();
        setCollegesData(collegeData.documents);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchTrades = async () => {
      try {
        const tradesData = await tradeService.listTrades();
        setTradesData(tradesData.documents);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchBatches = async () => {
      try {
        const batchData = await batchService.listBatches();
        setBatchesData(batchData.documents);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchColleges();
    fetchTrades();
    fetchBatches();
  }, [user.$id]);

  useEffect(() => {
    if (tradesData.length > 0 && profile) {
      setValue("collegeId", profile.collegeId);
      setValue("tradeId", profile.tradeId);
      setValue("batchId", profile.batchId);
    }
  }, [profile, setValue, tradesData]);

  const handleUpdateProfile = async (data) => {
    setIsUpdating(true);
    try {
      const updatedProfile = await userProfileService.updateUserProfile(
        profile.$id,
        {
          collegeId: data.collegeId,
          tradeId: data.tradeId,
          batchId: data.batchId,
        }
      );
      if (updatedProfile) {
        toast.success("Profile Updated");
        dispatch(addProfile(updatedProfile));
      }
    } catch (error) {
      toast.error(error.message);
      setError("Failed to update profile. Please try again.");
      console.log(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <>
        <div className="w-full min-h-screen flex items-center justify-center">
          <ClipLoader color="abc123" size={50} />
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center mt-10">
        Edit Your Profile
      </h1>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      <form
        onSubmit={handleSubmit(handleUpdateProfile)}
        className="space-y-4 px-20"
      >
        <div>
          <label className="block text-gray-600">College</label>
          <select
            {...register("collegeId")}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              Select a college
            </option>
            {collegesData &&
              collegesData.map((college) => (
                <option key={college.$id} value={college.$id}>
                  {college.collageName}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-600">Trade</label>
          <select
            {...register("tradeId")}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              Select a trade
            </option>
            {tradesData &&
              tradesData.map((trade) => (
                <option key={trade.$id} value={trade.$id}>
                  {trade.tradeName}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-600">Batch</label>
          <select
            {...register("batchId")}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              Select a batch
            </option>
            {batchesData &&
              batchesData.map((batch) => (
                <option key={batch.$id} value={batch.$id}>
                  {batch.BatchName}
                </option>
              ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full disabled:bg-gray-500 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          disabled={
            !selectedCollegeId ||
            !selectedTradeId ||
            !selectedBatchId ||
            isUpdating
          }
        >
          {isUpdating ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </>
  );
};

export default EditProfileForm;
