import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, subYears, subDays } from "date-fns";
import { Query } from "appwrite";
import { ClipLoader } from "react-spinners";
import { FaCalendar } from "react-icons/fa";

import userStatsService from "../../../appwrite/userStats";
import tradeservice from "../../../appwrite/tradedetails";
import { selectProfile } from "../../../store/profileSlice";
import CustomSelect from "../../components/CustomSelect";
import TodaysTestsPopup from "../popup/TodaysTests";

// Custom chart component to reduce repetition
const ChartContainer = ({ title, subtitle, children, rightContent }) => (
  <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
    <div className="flex flex-col justify-between">
      <div className="flex justify-between w-full">
        <h2 className="text-base font-semibold text-gray-600">{title}</h2>
        {rightContent}
      </div>
      {subtitle && (
        <h1 className="text-2xl text-gray-700 font-semibold py-2">
          {subtitle}
        </h1>
      )}
    </div>
    {children}
  </div>
);

const Dashboard = () => {
  const user = useSelector((state) => state.user);
  const profile = useSelector(selectProfile);
  
  const [state, setState] = useState({
    trades: {},
    allUsersStats: [],
    currUserRecord: null,
    timePeriod: "day",
    isLoading: true,
    isPopupOpen: false,
    topContributors: [],
    topScorers: [],
    testsToday: [],
    metrics: {
      totalQuestions: 0,
      totalTests: 0,
      questionsCount: 0,
      testsCount: 0,
      updatedAt: null
    }
  });

  // Helper function to get current time based on period
  const getTimeForPeriod = useCallback((period) => {
    const timeMap = {
      day: () => format(startOfDay(new Date()), "yyyyMMdd"),
      yesterday: () => format(subDays(new Date(), 1), "yyyyMMdd"),
      week: () => format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyyMMdd"),
      month: () => format(startOfMonth(new Date()), "yyyyMMdd"),
      year: () => format(startOfYear(new Date()), "yyyyMMdd"),
      allTime: () => format(subYears(new Date(), 1), "yyyyMMdd")
    };
    return (timeMap[period] || timeMap.day)();
  }, []);

  // Memoize data processing functions
  const processUserStats = useCallback((stats) => {
    const currentUserStats = stats.find((stat) => stat.userId === user.$id);
    if (!currentUserStats) return null;

    const processItems = (items, dateKey) => {
      return Object.values(items.reduce((acc, curr) => {
        const date = curr[dateKey].split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0 };
        }
        acc[date].count += 1;
        return acc;
      }, {}));
    };

    const processScores = (tests) => {
      return Object.values(tests.reduce((acc, curr) => {
        const date = curr.createdAt.split("T")[0];
        const percent = ((curr.score / curr.quesCount) * 100).toFixed(2);
        
        if (!acc[curr.paperId]) {
          acc[curr.paperId] = {
            date,
            paperId: curr.paperId,
            score: curr.score || 0,
            percent
          };
        }
        return acc;
      }, {}));
    };

    return {
      tests: processItems(currentUserStats.tests, 'createdAt'),
      questions: processItems(currentUserStats.questions, 'createdAt'),
      scores: processScores(currentUserStats.tests)
    };
  }, [user.$id]);

  // Process top contributors and scorers
  const processTopStats = useCallback((stats, timePeriod) => {
    const contributors = stats
      .filter(stat => stat[`${timePeriod}_questionsCount`] > 0)
      .sort((a, b) => {
        const questionsDiff = b[`${timePeriod}_questionsCount`] - a[`${timePeriod}_questionsCount`];
        return questionsDiff !== 0 ? questionsDiff : b[`${timePeriod}_maxScore`] - a[`${timePeriod}_maxScore`];
      })
      .slice(0, 30);

    const scorers = stats
      .filter(stat => stat[`${timePeriod}_maxScore`] > 0)
      .sort((a, b) => {
        const scoreDiff = b[`${timePeriod}_maxScore`] - a[`${timePeriod}_maxScore`];
        return scoreDiff !== 0 ? scoreDiff : b[`${timePeriod}_questionsCount`] - a[`${timePeriod}_questionsCount`];
      })
      .slice(0, 30);
      

    return { contributors, scorers };
  }, []);

  // Process tests for today
  const processTestsToday = useCallback((stats, timePeriod) => {
    const currentTime = getTimeForPeriod(timePeriod);
    
    const testStats = stats.reduce((acc, doc) => {
      doc.tests.forEach((test) => {
        const testTime = format(new Date(test.createdAt), "yyyyMMdd");
        if (testTime >= currentTime) {
          if (!acc[doc.userId]) {
            acc[doc.userId] = {
              userId: doc.userId,
              userName: doc.userName,
              totalTests: 0,
              maxPercent: Number((test.score / test.quesCount) * 100).toFixed(2),
            };
          }
          acc[doc.userId].totalTests += 1;
          acc[doc.userId].maxPercent = Math.max(
            acc[doc.userId].maxPercent,
            Number((test.score / test.quesCount) * 100).toFixed(2)
          );
        }
      });
      return acc;
    }, {});

    return Object.values(testStats).sort((a, b) => b.maxPercent - a.maxPercent);
  }, [getTimeForPeriod]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!profile) return;

    try {
      const [tradeRes, statsRes] = await Promise.all([
        tradeservice.getTrade(profile.tradeId),
        userStatsService.getAllStats([
          Query.equal("tradeId", profile.tradeId),
          Query.equal("collegeId", profile.collegeId),
          Query.equal("batchId", profile.batchId),
        ])
      ]);

      if (statsRes.documents.length > 0) {
        const processedStats = statsRes.documents.map(stat => ({
          ...stat,
          questions: stat.questions.map(ques => JSON.parse(ques)),
          tests: stat.tests.map(test => JSON.parse(test))
        }));

        const { contributors, scorers } = processTopStats(processedStats, state.timePeriod);
        const testsToday = processTestsToday(processedStats, state.timePeriod);

        setState(prev => ({
          ...prev,
          trades: tradeRes || {},
          allUsersStats: processedStats,
          currUserRecord: processUserStats(processedStats),
          topContributors: contributors,
          topScorers: scorers,
          testsToday,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [profile, state.timePeriod, processUserStats, processTopStats, processTestsToday]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update metrics when time period changes
  useEffect(() => {
    if (state.allUsersStats.length === 0) return;

    const newMetrics = state.allUsersStats.reduce((acc, stat) => {
      if (stat.userId === user.$id) {
        acc.totalQuestions = stat.allTime_questionsCount;
        acc.totalTests = stat.allTime_testsCount;
        acc.updatedAt = stat.$updatedAt;
      }
      acc.questionsCount += stat[`${state.timePeriod}_questionsCount`] || 0;
      acc.testsCount += stat[`${state.timePeriod}_testsCount`] || 0;
      return acc;
    }, { totalQuestions: 0, totalTests: 0, questionsCount: 0, testsCount: 0, updatedAt: null });

    setState(prev => ({ ...prev, metrics: newMetrics }));
  }, [state.allUsersStats, state.timePeriod, user.$id]);

  if (state.isLoading) {
    return (
      <div className="w-full flex items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
        <ClipLoader color="#123abc" size={50} />
      </div>
    );
  }

  if (!state.allUsersStats || !Array.isArray(state.allUsersStats)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p>No data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen mt-5 overflow-hidden">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        {state.metrics.updatedAt && (
          <h6 className="text-sm text-slate-500">
            Updated At: {format(state.metrics.updatedAt, "dd/MM/yyyy hh:mm a")}
          </h6>
        )}
        <h6 className="text-sm text-slate-500 capitalize">
          {state.trades?.tradeName?.toLowerCase() || ""}
        </h6>
      </div>

      {/* Metrics Cards */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-500">My Total Questions</h2>
          <p className="text-4xl py-2 font-semibold">
            {state.metrics.totalQuestions} <span className="text-sm text-slate-600">Nos.</span>
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-500">My Total Tests</h2>
          <p className="text-4xl py-2 font-semibold">
            {state.metrics.totalTests} <span className="text-sm text-slate-600">Nos.</span>
          </p>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="w-full flex items-end justify-end mb-6">
        <CustomSelect
          icon={<FaCalendar />}
          options={["day", "week", "month", "year", "allTime"]}
          value={state.timePeriod}
          onChangeFunc={(value) => setState(prev => ({ ...prev, timePeriod: value }))}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer
          title="Top Questions Contributors"
          subtitle={`${state.metrics.questionsCount} Nos. of Questions`}
        >
          {state.topContributors.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={state.topContributors.map(item => ({
                name: item.userName,
                questions: item[`${state.timePeriod}_questionsCount`]
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="questions" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <ChartContainer
          title={`Top percentage of ${state.timePeriod}`}
          subtitle={`${state.metrics.testsCount} Nos. of Tests`}
          rightContent={
            <button
              onClick={() => setState(prev => ({ ...prev, isPopupOpen: true }))}
              className="underline text-blue-800 hover:text-blue-950"
            >
              View all..
            </button>
          }
        >
          {console.log("ts",state.topScorers)}
          {state.topScorers.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={state.topScorers.map(item => ({
                name: item.userName,
                maxScore: item[`${state.timePeriod}_maxScore`]
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="maxScore" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <ChartContainer title="Your Test Count Timeline">
          {state.currUserRecord && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={state.currUserRecord.tests}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <ChartContainer title="Your Questions Count Timeline">
          {state.currUserRecord && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={state.currUserRecord.questions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <ChartContainer title="Your Scores Timeline">
          {state.currUserRecord && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={state.currUserRecord.scores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => [
                    `Percent: ${value}`,
                    `Paper ID: ${props.payload.paperId}`,
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend
                  formatter={(value) => {
                    if (value === "percent") return "Percent";
                    if (value === "date") return "Date";
                    if (value === "paperId") return "Paper ID";
                    return value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* Popup */}
      <TodaysTestsPopup
        timePeriod={state.timePeriod}
        data={state.testsToday}
        isOpen={state.isPopupOpen}
        onClose={() => setState(prev => ({ ...prev, isPopupOpen: false }))}
      />
    </div>
  );
};

export default Dashboard;