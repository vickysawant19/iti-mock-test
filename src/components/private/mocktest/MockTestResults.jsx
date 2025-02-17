import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import questionpaperservice from "../../../appwrite/mockTest";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../store/profileSlice";

const MockTestResults = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const profile = useSelector(selectProfile);

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await questionpaperservice.getUserResults(paperId);
        const updatedRes = (res ?? []).map((item) => ({
          timeTaken: differenceInMinutes(
            new Date(item.endTime),
            new Date(item.startTime)
          ),
          ...item,
        }));
        setData(
          (updatedRes ?? [])
            .filter((item) => !item.isOriginal)
            .sort(
              (a, b) =>
                b.score - a.score ||
                a.timeTaken - b.timeTaken ||
                new Date(a.endTime) - new Date(b.endTime)
            )
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [paperId]);

  const formatName = (name) =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const filteredData = useMemo(
    () =>
      data.filter((item) =>
        item.userName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [data, searchQuery]
  );

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Rank, Name, Score, Time Taken, Submission Status"]
        .concat(
          filteredData.map(
            (res, index) =>
              `${index + 1}, ${res.userName}, ${res.score}, ${
                res.submitted
                  ? differenceInMinutes(
                      new Date(res.endTime),
                      new Date(res.startTime)
                    )
                  : "Not Submitted"
              }, ${res.submitted ? "Submitted" : "Not Submitted"}`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mock_test_results.csv");
    document.body.appendChild(link);
    link.click();
  };

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

  if (loading)
    return <Loader2 className="animate-spin text-blue-500 mx-auto" />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold">Mock Test Results</h1>
        </div>

        <input
          type="text"
          placeholder="Search by name..."
          className="border p-2 rounded w-full mb-4"
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button
          onClick={exportCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          Export CSV
        </button>

        <div className="overflow-x-auto bg-white shadow rounded-lg ">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 text-left">Rank</th>
                <th className="p-4 text-left">Student Name</th>
                <th className="p-4 text-left">Score</th>
                <th className="p-4 text-left">Total Minutes</th>
                <th className="p-4 text-left">Submission Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Submitted At
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((result, index) => (
                <tr
                  key={index}
                  className={
                    profile.userId === result.userId ? "bg-blue-50" : ""
                  }
                >
                  <td className="p-4 flex items-center gap-2">
                    {index + 1}
                    {index < 3 && (
                      <Trophy
                        className={`h-5 w-5 ${getMedalColor(index + 1)}`}
                      />
                    )}
                  </td>
                  <td className="p-4 font-medium">
                    {formatName(result.userName)}
                  </td>
                  <td className="p-4 text-blue-800 font-semibold">
                    {result.score || "-"}/{result.quesCount || 50}
                  </td>
                  <td className="p-4 text-gray-600">
                    {result.submitted
                      ? `${result.timeTaken} min`
                      : "Not Submitted"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        result.submitted
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.submitted ? "Submitted" : "Not Submitted"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {result.submitted
                      ? format(
                          new Date(result.endTime || result.$updatedAt),
                          "dd/MM/yyyy hh:mm a"
                        )
                      : "Not Submitted"}
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
