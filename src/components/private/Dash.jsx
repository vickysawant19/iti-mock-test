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

import userStatsService from "../../appwrite/userStats";

import CustomSelect from "../components/CustomSelect";
import { ClipLoader } from "react-spinners";
import { Query } from "appwrite";
import { selectProfile } from "../../store/profileSlice";
import { format } from "date-fns";
import tradeservice from "../../appwrite/tradedetails";

const Dashboard = () => {
  const user = useSelector((state) => state.user);
  const [trades, setTrades] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [allUsersStats, setAllUserStats] = useState([]);
  const [currUserRecord, setCurrUserRecord] = useState({
    questions: [],
    tests: [],
  });
  const [timePeriod, setTimePeriod] = useState("day");
  const [isLoading, setIsLoading] = useState(true);

  const [totalQuestions, setTotalQuestions] = useState();
  const [totalTests, setTotalTests] = useState();
  const [updatedAt, setUpdatedAt] = useState();

  const profile = useSelector(selectProfile);

  const fetchTrades = async () => {
    setIsLoading(true);
    try {
      const res = await tradeservice.getTrade(profile.tradeId);
      if (res) {
        setTrades(res);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsersStats = async () => {
    try {
      const stats = await userStatsService.getAllStats([
        Query.equal("tradeId", profile.tradeId),
        Query.equal("collegeId", profile.collegeId),
        Query.equal("batchId", profile.batchId),
      ]);

      if (stats.documents.length > 0) {
        setAllUserStats(stats.documents);

        const currentUserStats = stats.documents.find(
          (stats) => stats.userId === user.$id
        );

        if (currentUserStats) {
          const questions = currentUserStats.questions.map((ques) =>
            JSON.parse(ques)
          );

          const tests = currentUserStats.tests.map((tests) =>
            JSON.parse(tests)
          );

          const groupedQues = questions.reduce((acc, curr) => {
            let date = curr.createdAt.split("T")[0];

            if (!acc[date]) {
              acc[date] = { date, count: 0 };
            }
            acc[date].count += 1;
            return acc;
          }, {});

          const groupedTests = tests.reduce((acc, curr) => {
            let date = curr.createdAt.split("T")[0];

            if (!acc[date]) {
              acc[date] = { date, count: 0 };
            }
            acc[date].count += 1;
            return acc;
          }, {});

          const groupedScores = tests.reduce((acc, curr) => {
            let date = curr.createdAt.split("T")[0];

            if (!acc[curr.paperId]) {
              acc[curr.paperId] = {
                date,
                paperId: curr.paperId,
                score: curr.score || 0,
              };
            }
            acc[curr.paperId].paperId = curr.paperId;
            acc[curr.paperId].score = curr.score || 0;
            acc[curr.paperId].date = date;
            return acc;
          }, {});

          const quesArray = Object.values(groupedQues);
          const testsArray = Object.values(groupedTests);
          const scoresArray = Object.values(groupedScores);

          setCurrUserRecord((prev) => ({
            ...prev,
            tests: testsArray,
            questions: quesArray,
            scores: scoresArray,
          }));
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchAllUsersStats();
  }, [user.$id]);

  useEffect(() => {
    if (allUsersStats.length === 0) return;

    const filteredStats1 = allUsersStats.filter(
      (stat) => stat[`${timePeriod}_questionsCount`] > 0
    );

    const filteredStats2 = allUsersStats.filter(
      (stat) => stat[`${timePeriod}_maxScore`] > 0
    );

    const sortedQuestionStats = [...filteredStats1].sort((a, b) => {
      const questionsDiff =
        b[`${timePeriod}_questionsCount`] - a[`${timePeriod}_questionsCount`];
      if (questionsDiff !== 0) return questionsDiff;
      return b[`${timePeriod}_maxScore`] - a[`${timePeriod}_maxScore`];
    });

    const sortedScorersStats = [...filteredStats2].sort((a, b) => {
      const scoreDiff =
        b[`${timePeriod}_maxScore`] - a[`${timePeriod}_maxScore`];
      if (scoreDiff !== 0) return scoreDiff;
      return (
        b[`${timePeriod}_questionsCount`] - a[`${timePeriod}_questionsCount`]
      );
    });

    setTopContributors(sortedQuestionStats.slice(0, 20));
    setTopScorers(sortedScorersStats.slice(0, 20));
  }, [allUsersStats, timePeriod]);

  const handleTimePeriodChange = (value) => {
    setTimePeriod(value);
  };

  useEffect(() => {
    if (allUsersStats.length === 0) return;
    const updatedAt = allUsersStats?.find(
      (stat) => stat.userId === user.$id
    )?.$updatedAt;
    setUpdatedAt(updatedAt);

    const totalQuestions = allUsersStats
      ?.filter((stat) => stat.userId === user.$id)
      .reduce((acc, stat) => acc + stat.allTime_questionsCount, 0);
    setTotalQuestions(totalQuestions);

    const totalTests = allUsersStats
      ?.filter((stat) => stat.userId === user.$id)
      .reduce((acc, stat) => acc + stat.allTime_testsCount, 0);
    setTotalTests(totalTests);
  }, [allUsersStats]);

  // const topScorer = allUsersStats?.reduce(
  //   (prev, curr) => {
  //     const currScore = curr[`${timePeriod}_maxScore`];
  //     if (currScore > prev.maxScore) {
  //       return { maxScore: currScore, userName: curr.userName };
  //     }
  //     return prev;
  //   },
  //   { maxScore: 0, userName: "" }
  // );

  if (isLoading) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center"
        style={{ minHeight: `calc(100vh - 16px)` }}
      >
        <ClipLoader color="#123abc" size={50} />
      </div>
    );
  }

  if (!allUsersStats || !Array.isArray(allUsersStats)) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center"
        style={{ minHeight: `calc(100vh - 16px)` }}
      >
        <p>No data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen mt-5 overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 ">Dashboard</h1>
        {updatedAt && (
          <h6 className="text-sm text-slate-500">
            Updated At :{format(updatedAt, "dd/MM/yyyy hh:mm a")}
          </h6>
        )}
        <h6 className="text-sm text-slate-500 capitalize">
          {trades && trades.tradeName.toLowerCase()}
        </h6>
      </div>

      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-500 flex ">
            My Total Questions
          </h2>
          <p className="text-4xl py-2 font-semibold">
            {totalQuestions}{" "}
            <span className="text-sm text-slate-600">Nos.</span>
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-500">
            My Total Tests
          </h2>
          <p className="text-4xl py-2 font-semibold">
            {totalTests} <span className="text-sm text-slate-600">Nos.</span>
          </p>
        </div>
      </div>
      <div className="w-full flex items-end justify-end">
        <CustomSelect
          options={["day", "week", "month", "year", "allTime"]}
          value={timePeriod}
          onChangeFunc={handleTimePeriodChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <div className="flex justify-between">
            <h2 className="text-base font-semibold mb-4 ">
              Top Questions Contributors
              <p className="text-2xl m-2">
                {topContributors.length === 0 && (
                  <span className="text-red-500">No Top Contributors</span>
                )}
              </p>
            </h2>
          </div>
          {topContributors.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                width={600}
                height={300}
                data={topContributors.map((item) => ({
                  name: item.userName,
                  questions: item[`${timePeriod}_questionsCount`],
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="questions" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <div className="flex justify-between">
            <h2 className="text-base font-semibold mb-4">
              Top Scorers of {timePeriod}
              <p className="text-2xl m-2">
                {topScorers.length === 0 && (
                  <span className="text-red-500">No Top Scorers</span>
                )}
              </p>
            </h2>
          </div>
          {topScorers.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                width={600}
                height={300}
                data={topScorers.map((item) => ({
                  name: item.userName,
                  score: item[`${timePeriod}_maxScore`],
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <h2 className="text-base font-semibold mb-4">
            Your Test Count Timeline
          </h2>
          {currUserRecord && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                width={500}
                height={300}
                data={currUserRecord.tests.map((test) => ({
                  ...test,
                  paperId: test.paperId,
                }))}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <h2 className="text-base font-semibold mb-4">
            Your Questions Count Timeline
          </h2>
          {currUserRecord && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                width={500}
                height={300}
                data={currUserRecord.questions}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <h2 className="text-base font-semibold mb-4">Your Scores Timeline</h2>
          {currUserRecord && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                width={500}
                height={300}
                data={currUserRecord.scores}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => [
                    `Score: ${value}`,
                    `Paper ID: ${props.payload.paperId}`,
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend
                  formatter={(value) => {
                    if (value === "score") return "Score";
                    if (value === "date") return "Date";
                    if (value === "paperId") return "Paper ID";
                    return value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
