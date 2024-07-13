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
import userStats from "../../../functions/userStats";
import CustomSelect from "../components/CustomSelect";

const Dashboard = () => {
  const user = useSelector((state) => state.user);
  const [topContributors, setTopContributors] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [userRecord, setUserRecord] = useState([]);
  const [allUsersStats, setAllUserStats] = useState([]);
  const [currUserRecord, setCurrUserRecord] = useState({
    questions: [],
    tests: [],
  });
  const [timePeriod, setTimePeriod] = useState("day");

  // Effect to fetch user stats
  useEffect(() => {
    const fetchAllUsersStats = async () => {
      try {
        const stats = await userStatsService.getAllStats();
        setAllUserStats(stats.documents);

        const currentUserStats = stats.documents.find(
          (stats) => stats.userId === user.$id
        );

        const questions = currentUserStats.questions.map((ques) =>
          JSON.parse(ques)
        );

        const tests = currentUserStats.tests.map((tests) => JSON.parse(tests));

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
      } catch (error) {
        console.log(error);
      }
    };

    fetchAllUsersStats();
  }, [user.$id]);

  // Effect to handle other logic that depends on user stats and time period
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

    setTopContributors(sortedQuestionStats.slice(0, 20)); // Get top 10 contributors
    setTopScorers(sortedScorersStats.slice(0, 20)); // Get top 10 scorers
  }, [allUsersStats, timePeriod]);

  // console.log(currUserRecord);

  // const handleTimePeriodChange = (e) => {
  //   setTimePeriod(e.target.value);
  // };
  const handleTimePeriodChange = (value) => {
    setTimePeriod(value);
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

  const topScorer = allUsersStats.reduce(
    (prev, curr) => {
      const currScore = curr[`${timePeriod}_maxScore`];
      if (currScore > prev.maxScore) {
        return { maxScore: currScore, userName: curr.userName };
      }
      return prev;
    },
    { maxScore: 0, userName: "" }
  );

  // const maxScore = currUserRecord.scores.reduce(
  //   (acc, curr) => (curr.score > acc ? curr.score : acc),
  //   0
  // );

  if (!currUserRecord || !Array.isArray(currUserRecord.scores)) {
    return <div>Loading...</div>;
  }

  const maxScore = Math.max(
    ...currUserRecord.scores.map((score) => score.score)
  );
  console.log("timeperiod", timePeriod);

  return (
    <div className="p-6 bg-gray-100 min-h-screen mt-5">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">Dashboard</h1>
      </div>

      {/* Summary Statistics */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-base font-semibold text-slate-500 ">
            My Total Questions
          </h2>
          <p className="text-2xl font-semibold">{totalQuestions}</p>
          <p className="text-xs text-nowrap text-gray-600">
            {new Date(updatedAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-base font-semibold text-slate-500">
            My Total Tests
          </h2>
          <p className="text-2xl font-semibold">{totalTests}</p>
          <p className="text-xs text-nowrap text-gray-600">
            {new Date(updatedAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}
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
        {/* Top Contributors */}
        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <div className="flex justify-between">
            <h2 className="text-base font-semibold mb-4 ">
              Top Questions Contributors
              <p className="text-2xl m-2">
                {allUsersStats.reduce(
                  (prev, curr) =>
                    (prev += curr[`${timePeriod}_questionsCount`]),
                  0
                )}
              </p>
            </h2>
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
          <h2 className="text-base font-semibold mb-4">
            Top Scorers
            <div className="flex items-center mt-1 rounded-xl">
              <p className="text-2xl m-2">{topScorer.maxScore || 0}</p>
              <p className="text-xl m-2">{topScorer.userName}</p>
            </div>
          </h2>

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
          <div className="">
            <h2 className="text-base font-semibold ">My Questions Created</h2>
            <h1 className="text-2xl m-2 font-semibold">
              {currUserRecord.questions.reduce(
                (total, curr) => total + curr.count,
                0
              )}
            </h1>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currUserRecord.questions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* My Test Created */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="">
            <h2 className="text-xl font-semibold mb-4">My Test Created</h2>
            <h1 className="text-2xl m-2 font-semibold">
              {currUserRecord.tests.reduce(
                (total, curr) => total + curr.count,
                0
              )}
            </h1>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currUserRecord.tests}>
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
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currUserRecord.scores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 50]} />
              <Tooltip
                formatter={(value, name, props) => [
                  `Score: ${value}`,
                  `Paper ID: ${props.payload.paperId}`,
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                name="Score"
                stroke="#ff7300"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
