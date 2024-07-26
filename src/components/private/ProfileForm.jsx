import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import tradeService from "../../appwrite/tradedetails";
import batchService from "../../appwrite/batchService";
import userProfileService from "../../appwrite/userProfileService";
import { ClipLoader } from "react-spinners";
import { addProfile, selectProfile } from "../../store/profileSlice";
import collegeService from "../../appwrite/collageService";

const ProfileForm = () => {
  const user = useSelector((state) => state.user);
  const [collegeData, setCollegeData] = useState([]);
  const [tradeData, setTradeData] = useState([]);
  const [batchesData, setBatchesData] = useState([]);

  const [selectedTrade, setSelectedTrade] = useState([]);

  const { register, handleSubmit, watch, setValue } = useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchColleges = async () => {
      setIsLoading(true);
      try {
        const collegeData = await collegeService.listColleges();

        setCollegeData(collegeData.documents);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTrades = async () => {
      setIsLoading(true);
      try {
        const tradesData = await tradeService.listTrades();
        setTradeData(tradesData.documents);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchBatches = async () => {
      setIsLoading(true);
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

  // console.log(collegeData);
  // console.log(tradeData);
  // console.log(batchesData);

  const handleTradeChange = (e) => {
    e.preventDefault();
    const trade = tradeData.find((trade) => trade.$id === e.target.value);
    setSelectedTrade(trade);
  };

  const handleCreateProfile = async (data) => {
    data.userId = user.$id;
    data.userName = user.name;
    data.enrolledAt = new Date().toISOString();

    try {
      const newProfile = await userProfileService.createUserProfile(data);
      dispatch(addProfile(newProfile));
    } catch (error) {
      setError("Failed to create profile. Please try again.");
      console.log(error);
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
    <>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Create Your Profile
      </h1>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit(handleCreateProfile)} className="space-y-4">
        <div>
          <label className="block text-gray-600">Trade</label>
          <select
            {...register("collegeId")}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="" disabled>
              Select a College
            </option>
            {collegeData.map((college) => (
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
            onChange={handleTradeChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="" disabled>
              Select a trade
            </option>
            {tradeData.map((trade) => (
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="" disabled>
              Select a batch
            </option>
            {batchesData.map((batch) => (
              <option key={batch.$id} value={batch.$id}>
                {batch.BatchName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          disabled={false}
        >
          Create Profile
        </button>
      </form>
    </>
  );
};

export default ProfileForm;
