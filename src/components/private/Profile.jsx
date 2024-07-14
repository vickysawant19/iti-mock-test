import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import tradeService from "../../appwrite/tradedetails";
import batchService from "../../appwrite/batchService";
import userProfileService from "../../appwrite/userProfileService";
import { ClipLoader } from "react-spinners";
import { format } from "date-fns";

const Profile = () => {
  const user = useSelector((state) => state.user);
  const [profile, setProfile] = useState(null);
  const [tradedata, setTradeData] = useState([]);
  const [trades, setTrades] = useState({});
  const [batches, setBatches] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const { register, handleSubmit, watch, setValue } = useForm();
  const selectedTradeName = watch("tradeName");
  const selectedYear = watch("year");
  const selectedBatchId = watch("batchId");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    const fetchProfile = async () => {
      try {
        const profile = await userProfileService.getUserProfile(user.$id);
        setProfile(profile);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTrades = async () => {
      try {
        const tradesData = await tradeService.listTrades();
        setTradeData(tradesData.documents);
        const groupedTrades = tradesData.documents.reduce((acc, trade) => {
          if (!acc[trade.tradeName]) {
            acc[trade.tradeName] = [];
          }
          acc[trade.tradeName].push({ year: trade.year, id: trade.$id });
          return acc;
        }, {});
        setTrades(groupedTrades);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchBatches = async () => {
      try {
        const batchData = await batchService.listBatches();
        setBatches(batchData.documents);
        console.log(batchData);
      } catch (error) {
        console.log(error);
      }
    };

    fetchProfile();
    fetchTrades();
    fetchBatches();
  }, [user.$id]);

  useEffect(() => {
    if (selectedTradeName) {
      setAvailableYears(trades[selectedTradeName] || []);
      setValue("year", "");
      setValue("batchId", "");
    }
  }, [selectedTradeName, trades, setValue]);

  const handleCreateProfile = async (data) => {
    const selectedTrade = tradedata.find(
      (trade) => trade.tradeName === data.tradeName && trade.year === data.year
    );
    try {
      const newProfile = await userProfileService.createUserProfile(
        user.$id,
        selectedTrade.$id,
        data.batchId
      );
      setProfile(newProfile);
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
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        {batches && profile && trades ? (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Your Profile
            </h1>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-600">Name</h2>
                <p className="text-gray-800">{user.name}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-600">Email</h2>
                <p className="text-gray-800">{user.email}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-600">Contact</h2>
                <p className="text-gray-800">{user.phone}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-600">Trade</h2>
                <p className="text-gray-800">
                  {tradedata &&
                    tradedata.find((trade) => trade.$id === profile.tradeId)
                      ?.tradeName}
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-600">Batch</h2>
                <p className="text-gray-800">
                  {batches &&
                    batches.find((batch) => batch.$id === profile.batchId)
                      ?.BatchName}
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-600">
                  Enrolled At
                </h2>
                <p className="text-gray-800">
                  {format(profile.enrolledAt, "dd/MM/yyyy")}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Create Your Profile
            </h1>
            {error && <p className="text-red-600 text-center mb-4">{error}</p>}
            <form
              onSubmit={handleSubmit(handleCreateProfile)}
              className="space-y-4"
            >
              <div>
                <label className="block text-gray-600">Trade</label>
                <select
                  {...register("tradeName")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="" disabled>
                    Select a trade
                  </option>
                  {Object.keys(trades).map((tradeName) => (
                    <option key={tradeName} value={tradeName}>
                      {tradeName}
                    </option>
                  ))}
                </select>
              </div>
              {availableYears.length > 0 && (
                <div>
                  <label className="block text-gray-600">Year</label>
                  <select
                    {...register("year")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="" disabled>
                      Select a year
                    </option>
                    {availableYears.map((yearData) => (
                      <option key={yearData.year} value={yearData.year}>
                        {yearData.year}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedYear && (
                <div>
                  <label className="block text-gray-600">Batch</label>
                  <select
                    {...register("batchId")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="" disabled>
                      Select a batch
                    </option>
                    {batches.map((batch) => (
                      <option key={batch.$id} value={batch.$id}>
                        {batch.BatchName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                disabled={
                  !selectedTradeName || !selectedYear || !selectedBatchId
                }
              >
                Create Profile
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
