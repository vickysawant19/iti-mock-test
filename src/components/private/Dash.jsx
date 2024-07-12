import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { appwriteService } from "../../appwrite/appwriteConfig";
import userStatsService from "../../appwrite/userStats";

const Dashboard = () => {
  const user = useSelector((state) => state.user);
  const [topContributors, setTopContributors] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [userRecord, setUserRecord] = useState([]);
  const [allUsersStats, setAllUserStats] = useState([]);
  const [timePeriod, setTimePeriod] = useState("day");

  useEffect(() => {
    const functions = appwriteService.getFunctions();

    const userPerformance = async () => {
      try {
        const res = await functions.createExecution(
          "668e0d720029625b80c5",
          user.$id
        );
        const parsedRes = await JSON.parse(res.responseBody);
        setUserRecord(parsedRes.userData);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchAllUsersStats = async () => {
      try {
        const stats = await userStatsService.getAllStats();
        const filteredStats1 = stats.documents.filter(
          (stat) => stat.allTime_questionsCount > 0
        );

        const filteredStats2 = stats.documents.filter(
          (stat) => stat.allTime_maxScore > 0
        );

        const sortedQuestionStats = [...filteredStats1].sort((a, b) => {
          const questionsDiff =
            b.allTime_questionsCount - a.allTime_questionsCount;
          if (questionsDiff !== 0) return questionsDiff;
          return b.allTime_maxScore - a.allTime_maxScore;
        });

        const sortedScorersStats = [...filteredStats2].sort((a, b) => {
          const scoreDiff = b.allTime_maxScore - a.allTime_maxScore;
          if (scoreDiff !== 0) return scoreDiff;
          return b.allTime_questionsCount - a.allTime_questionsCount;
        });

        setAllUserStats(stats.documents);
        setTopContributors(sortedQuestionStats.slice(0, 10)); // Get top 10 contributors
        setTopScorers(sortedScorersStats.slice(0, 10)); // Get top 10 scorers
      } catch (error) {
        console.log(error);
      }
    };

    userPerformance();
    fetchAllUsersStats();
  }, [user.$id]);

  const handleTimePeriodChange = (e) => {
    setTimePeriod(e.target.value);
  };

  // Calculate total questions and tests
  const totalQuestions = allUsersStats
    .filter((stat) => stat.userId === user.$id)
    .reduce((acc, stat) => acc + stat.allTime_questionsCount, 0);

  const totalTests = allUsersStats
    .filter((stat) => stat.userId === user.$id)
    .reduce((acc, stat) => acc + stat.allTime_testsCount, 0);

  const updatedAt = allUsersStats.find(
    (stat) => stat.userId === user.$id
  )?.$updatedAt;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Summary Statistics */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold">My Total Questions</h2>
          <p className="text-2xl">{totalQuestions}</p>
          <p className="text-sm text-nowrap text-gray-600">
            {new Date(updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold">My Total Tests</h2>
          <p className="text-2xl">{totalTests}</p>
          <p className="text-sm text-nowrap text-gray-600">
            {new Date(updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
        {/* Top Contributors */}
        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold mb-4">
              Top Questions Contributors
            </h2>
            <select
              value={timePeriod}
              onChange={handleTimePeriodChange}
              className="mb-4 p-2 border rounded"
            >
              <option className="" value="day">
                Day
              </option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <hr />
              <option value="allTime">All Time</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topContributors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="userName"
                tick={{ textAnchor: "end", angle: -45 }}
                height={90}
                interval={0}
                tickFormatter={(value) =>
                  value.length > 10
                    ? `${value.split(" ")[0]} ${value
                        .split(" ")[1]
                        .slice(0, 1)}`
                    : value
                }
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={`${timePeriod}_questionsCount`}
                fill="#8884d8"
                name="Questions Count"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Scorers */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold mb-4">Top Scorers</h2>
            <select
              value={timePeriod}
              onChange={handleTimePeriodChange}
              className="mb-4 p-2 border rounded"
            >
              <option className="" value="day">
                Day
              </option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <hr />
              <option value="allTime">All Time</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topScorers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="userName"
                tick={{ textAnchor: "end", angle: -45 }}
                height={90}
                interval={0}
                tickFormatter={(value) =>
                  value.length > 10
                    ? `${value.split(" ")[0]} ${value
                        .split(" ")[1]
                        .slice(0, 1)}`
                    : value
                }
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={`${timePeriod}_maxScore`}
                name={`${timePeriod} Score`}
                fill="#ffc658"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Questions Created */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold mb-4">My Questions Created</h2>
            <select
              value={timePeriod}
              onChange={handleTimePeriodChange}
              className="mb-4 p-2 border rounded"
            >
              <option className="" value="day">
                Day
              </option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <hr />
              <option value="allTime">All Time</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userRecord[timePeriod]?.questionsCreated}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Your Score Progress */}
        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold mb-4">My Score Progress</h2>
            <select
              value={timePeriod}
              onChange={handleTimePeriodChange}
              className="mb-4 p-2 border rounded"
            >
              <option className="" value="day">
                Day
              </option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <hr />
              <option value="allTime">All Time</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userRecord[timePeriod]?.scoresByPaper}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="paperId" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
