import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import tradeservice from "../../appwrite/tradedetails";
import batchService from "../../appwrite/batchService";

const ProfileView = ({ profile }) => {
  const user = useSelector((state) => state.user);

  const [tradedata, setTradeData] = useState([]);
  const [batches, setBatches] = useState([]);

  const fetchTrades = async () => {
    try {
      const res = await tradeservice.listTrades();
      setTradeData(res.documents);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await batchService.listBatches();
      setBatches(res.documents);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchBatches();
  }, []);

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
