import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronFirst, Loader2, Trophy } from "lucide-react";
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

        setData(
          res
            ?.filter((item) => item.isOriginal !== true)
            .sort((a, b) => b.score - a.score)
        );
      } catch (error) {
        console.log(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [paperId]);

  const formatName = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const getMedalColor = (position) => {
    switch (position) {
      case 1:
        return "text-yellow-500";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-amber-700";
      default:
        return "hidden";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mock Test Results
            </h1>
            <p className="text-sm text-gray-500">Paper ID: {paperId}</p>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Rank
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Student Name
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Score
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Submitted At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.map((result, index) => (
                <tr
                  key={index}
                  className={`
                    transition-colors hover:bg-gray-50
                    ${profile.userId === result.userId ? "bg-blue-50" : ""}
                  `}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{index + 1}</span>
                      <Trophy
                        className={`h-5 w-5 ${getMedalColor(index + 1)}`}
                      />
                    </div>
                  </td>
                  <td className="p-4 font-medium">
                    {formatName(result.userName)}
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      {result.score || "-"}/{result.quesCount || 50}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {format(
                      result.endTime || result.$updatedAt,
                      "dd/MM/yyyy hh:mm a"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MockTestResults;
