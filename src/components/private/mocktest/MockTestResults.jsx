import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSpinner, FaArrowLeft } from "react-icons/fa";
import { format } from "date-fns";

import questionpaperservice from "../../../appwrite/mockTest";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../store/profileSlice";

const MockTestResults = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const profile = useSelector(selectProfile);

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await questionpaperservice.getUserResults(paperId);
        res.sort((a, b) => b.score - a.score);
        setData(res);
      } catch (error) {
        console.log(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [paperId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  const winner = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  return (
    <div className="container mx-auto p-4 mt-8">
      <div className="flex items-center mb-4  gap-4 pl-4">
        <button onClick={() => navigate(-1)} className="mr-2">
          <FaArrowLeft className="text-xl text-blue-900 hover:text-blue-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Mock Test Results</h1>
          <p className="text-sm text-gray-500">Paper ID: {paperId}</p>
        </div>
      </div>
      <table className="min-w-full bg-white border text-sm">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-center">Sr No</th>
            <th className="py-2 px-4 border-b text-center">Student Name</th>
            <th className="py-2 px-4 border-b text-center">Score</th>
            <th className="py-2 px-4 border-b text-center">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {data.map((result, index) => (
            <tr
              key={index}
              className={`${
                profile.userId === result.userId
                  ? "bg-blue-200 font-semibold"
                  : ""
              }`}
            >
              <td className="py-2 px-4 border-b text-center">{index + 1}</td>
              <td className="py-2 px-4 border-b text-center">
                {result.userName} {winner[index + 1]}
              </td>
              <td className="py-2 px-4 border-b text-center text-base">
                {result.score || "-"}/
                <span className="">{result.quesCount || 50}</span>
              </td>
              <td className="py-2 px-4 border-b text-center">
                {format(result.$updatedAt, "dd/MM/yyyy HH:MM a")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MockTestResults;
