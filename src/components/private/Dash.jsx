import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { appwriteService } from "../../appwrite/appwriteConfig";

const Dashboard = () => {
  const user = useSelector((state) => state.user);
  const [topContributors, setTopContributors] = useState({});
  const [userRecord, setUserRecord] = useState([]);

  const [timePeriod, setTimePeriod] = useState("month");

  useEffect(() => {
    const functions = appwriteService.getFunctions();

    const fetchContributionData = async () => {
      try {
        const res = await functions.createExecution("668d60ac00136c510e08");
        const parsedRes = await JSON.parse(res.responseBody);
        setTopContributors(parsedRes.topContributors);
      } catch (error) {
        console.log(error);
      }
    };
    fetchContributionData();

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
    userPerformance();
  }, []);

  console.log(userRecord);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const handleTimePeriodChange = (e) => {
    setTimePeriod(e.target.value);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Top Contributors */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Top Contributors</h2>
          <select
            value={timePeriod}
            onChange={handleTimePeriodChange}
            className="mb-4 p-2 border rounded"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topContributors[timePeriod]?.contributors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="userName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="questionsCount" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Scorers */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Top Scorers</h2>
          <select
            value={timePeriod}
            onChange={handleTimePeriodChange}
            className="mb-4 p-2 border rounded"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topContributors[timePeriod]?.scorers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="userName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Questions Created</h2>
          <select
            value={timePeriod}
            onChange={handleTimePeriodChange}
            className="mb-4 p-2 border rounded"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
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

        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Score Progress</h2>
          <select
            value={timePeriod}
            onChange={handleTimePeriodChange}
            className="mb-4 p-2 border rounded"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
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
