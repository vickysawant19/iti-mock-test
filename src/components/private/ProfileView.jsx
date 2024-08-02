import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import tradeservice from "../../appwrite/tradedetails";
import batchService from "../../appwrite/batchService";
import collegeService from "../../appwrite/collageService";
import { ClipLoader } from "react-spinners";

const ProfileView = ({ profile }) => {
  const user = useSelector((state) => state.user);

  const [tradedata, setTradeData] = useState([]);
  const [batches, setBatches] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrades = async () => {
    setIsLoading(true);
    try {
      const res = await tradeservice.listTrades();
      setTradeData(res.documents);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await batchService.listBatches();
      setBatches(res.documents);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchColleges = async () => {
    setIsLoading(true);
    try {
      const res = await collegeService.listColleges();
      setColleges(res.documents);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchBatches();
    fetchColleges();
  }, []);

  if (isLoading) {
    return (
      <>
        <div className="flex w-full h-full items-center justify-center">
          <ClipLoader color="#123abc" size={50} />
        </div>
      </>
    );
  }

  return (
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
          <h2 className="text-lg font-semibold text-gray-600">College</h2>
          <p className="text-gray-800 capitalize ">
            {colleges &&
              colleges
                .find((clg) => clg.$id === profile.collegeId)
                ?.collageName.toLowerCase()}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-600">Trade</h2>
          <p className="text-gray-800 capitalize">
            {tradedata &&
              tradedata
                .find((trade) => trade.$id === profile.tradeId)
                ?.tradeName.toLowerCase()}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-600">Batch</h2>
          <p className="text-gray-800">
            {batches &&
              batches.find((batch) => batch.$id === profile.batchId)?.BatchName}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-600">Enrolled At</h2>
          <p className="text-gray-800">
            {format(profile?.enrolledAt, "dd/MM/yyyy")}
          </p>
        </div>
      </div>
    </>
  );
};

export default ProfileView;
