import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  subYears,
  subDays,
} from "date-fns";
import { Query } from "appwrite";
import { FaCalendar } from "react-icons/fa";
import { motion } from "framer-motion";

import userStatsService from "../../../appwrite/userStats";
import tradeservice from "../../../appwrite/tradedetails";
import { selectProfile } from "../../../store/profileSlice";
import CustomSelect from "../../components/CustomSelect";
import TodaysTestsPopup from "../popup/TodaysTests";

const SkeletonChart = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-sm w-1/4 mb-4"></div>
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-sm w-1/3 mb-6"></div>
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
  </div>
);

const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-sm w-3/4 mb-2"></div>
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-sm w-1/2"></div>
  </div>
);

// Custom chart component to reduce repetition
const ChartContainer = ({ title, subtitle, children, rightContent }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {rightContent}
    </div>
    {children}
  </motion.div>
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
      updatedAt: null,
    },
  });

  // Define chart colors for both themes
  const chartColors = {
    questionsBar: "#10b981", // green-500
    scoresBar: "#f97316", // orange-500
    testsBar: "#3b82f6", // blue-500
    scoreLine: "#8b5cf6", // indigo-500
    cartesianGrid: "#e5e7eb", // gray-200
    axisText: "#6b7280", // gray-500
  };

  // Helper function to get current time based on period
  const getTimeForPeriod = useCallback((period) => {
    const timeMap = {
      day: () => format(startOfDay(new Date()), "yyyyMMdd"),
      yesterday: () => format(subDays(new Date(), 1), "yyyyMMdd"),
      week: () =>
        format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyyMMdd"),
      month: () => format(startOfMonth(new Date()), "yyyyMMdd"),
      year: () => format(startOfYear(new Date()), "yyyyMMdd"),
      allTime: () => format(subYears(new Date(), 1), "yyyyMMdd"),
    };
    return (timeMap[period] || timeMap.day)();
  }, []);

  // Memoize data processing functions
  const processUserStats = useCallback(
    (stats) => {
      const currentUserStats = stats.find((stat) => stat.userId === user.$id);
      if (!currentUserStats) return null;

      const processItems = (items, dateKey) => {
        return Object.values(
          items.reduce((acc, curr) => {
            const date = curr[dateKey].split("T")[0];
            if (!acc[date]) {
              acc[date] = { date, count: 0 };
            }
            acc[date].count += 1;
            return acc;
          }, {})
        );
      };

      const processScores = (tests) => {
        return Object.values(
          tests.reduce((acc, curr) => {
            const date = curr.createdAt.split("T")[0];
            const percent = ((curr.score / curr.quesCount) * 100).toFixed(2);

            if (!acc[curr.paperId]) {
              acc[curr.paperId] = {
                date,
                paperId: curr.paperId,
                score: curr.score || 0,
                percent,
              };
            }
            return acc;
          }, {})
        );
      };

      return {
        tests: processItems(currentUserStats.tests, "createdAt"),
        questions: processItems(currentUserStats.questions, "createdAt"),
        scores: processScores(currentUserStats.tests),
      };
    },
    [user.$id]
  );

  // Process top contributors and scorers
  const processTopStats = useCallback((stats, timePeriod) => {
    const contributors = stats
      .filter((stat) => stat[`${timePeriod}_questionsCount`] > 0)
      .sort((a, b) => {
        const questionsDiff =
          b[`${timePeriod}_questionsCount`] - a[`${timePeriod}_questionsCount`];
        return questionsDiff !== 0
          ? questionsDiff
          : b[`${timePeriod}_maxScore`] - a[`${timePeriod}_maxScore`];
      })
      .slice(0, 30);

    const scorers = stats
      .filter((stat) => stat[`${timePeriod}_maxScore`] > 0)
      .sort((a, b) => {
        const scoreDiff =
          b[`${timePeriod}_maxScore`] - a[`${timePeriod}_maxScore`];
        return scoreDiff !== 0
          ? scoreDiff
          : b[`${timePeriod}_questionsCount`] -
              a[`${timePeriod}_questionsCount`];
      })
      .slice(0, 30);

    return { contributors, scorers };
  }, []);

  // Process tests for today
  const processTestsToday = useCallback(
    (stats, timePeriod) => {
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
                maxPercent: Number((test.score / test.quesCount) * 100).toFixed(
                  2
                ),
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

      return Object.values(testStats).sort(
        (a, b) => b.maxPercent - a.maxPercent
      );
    },
    [getTimeForPeriod]
  );

  const fetchData = useCallback(async () => {
    if (!profile) return;

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const [tradeRes, statsRes] = await Promise.all([
        tradeservice.getTrade(profile.tradeId),
        userStatsService.getAllStats([
          Query.equal("tradeId", profile.tradeId),
          Query.equal("collegeId", profile.collegeId),
          Query.equal("batchId", profile.batchId),
        ]),
      ]);

      if (statsRes.documents.length > 0) {
        const processedStats = statsRes.documents.map((stat) => ({
          ...stat,
          questions: stat.questions.map((ques) => JSON.parse(ques)),
          tests: stat.tests.map((test) => JSON.parse(test)),
        }));

        const { contributors, scorers } = processTopStats(
          processedStats,
          state.timePeriod
        );
        const testsToday = processTestsToday(processedStats, state.timePeriod);

        setState((prev) => ({
          ...prev,
          trades: tradeRes || {},
          allUsersStats: processedStats,
          currUserRecord: processUserStats(processedStats),
          topContributors: contributors,
          topScorers: scorers,
          testsToday,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [
    profile,
    state.timePeriod,
    processUserStats,
    processTopStats,
    processTestsToday,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update metrics when time period changes
  useEffect(() => {
    if (state.allUsersStats.length === 0) return;

    const newMetrics = state.allUsersStats.reduce(
      (acc, stat) => {
        if (stat.userId === user.$id) {
          acc.totalQuestions = stat.allTime_questionsCount;
          acc.totalTests = stat.allTime_testsCount;
          acc.updatedAt = stat.$updatedAt;
        }
        acc.questionsCount += stat[`${state.timePeriod}_questionsCount`] || 0;
        acc.testsCount += stat[`${state.timePeriod}_testsCount`] || 0;
        return acc;
      },
      {
        totalQuestions: 0,
        totalTests: 0,
        questionsCount: 0,
        testsCount: 0,
        updatedAt: null,
      }
    );

    setState((prev) => ({ ...prev, metrics: newMetrics }));
  }, [state.allUsersStats, state.timePeriod, user.$id]);

  if (state.isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <SkeletonChart key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!state.allUsersStats.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-gray-600 dark:text-gray-400">
            No data available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {state.metrics.updatedAt && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last Updated:{" "}
                {format(state.metrics.updatedAt, "dd/MM/yyyy hh:mm a")}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
              {state.trades?.tradeName?.toLowerCase() || ""}
            </p>
          </div>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "My Total Questions",
              value: state.metrics.totalQuestions,
            },
            { title: "My Total Tests", value: state.metrics.totalTests },
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </h2>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                {metric.value}{" "}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Nos.
                </span>
              </p>
            </motion.div>
          ))}
        </div>

        {/* Time Period Selector */}
        <div className="flex justify-end mb-8">
          <CustomSelect
            icon={<FaCalendar className="text-gray-500 dark:text-gray-400" />}
            options={["day", "week", "month", "year", "allTime"]}
            value={state.timePeriod}
            onChangeFunc={(value) =>
              setState((prev) => ({ ...prev, timePeriod: value }))
            }
            className="w-48"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Top Questions Contributors Chart */}
          <ChartContainer
            title="Top Questions Contributors"
            subtitle={`${state.metrics.questionsCount} Questions`}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={state.topContributors.map((item) => ({
                  name: item.userName,
                  questions: item[`${state.timePeriod}_questionsCount`],
                }))}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.cartesianGrid}
                />
                <XAxis dataKey="name" stroke={chartColors.axisText} />
                <YAxis stroke={chartColors.axisText} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#1f2937",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="questions"
                  fill={chartColors.questionsBar}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Top Performers Chart */}
          <ChartContainer
            title={`Top ${state.timePeriod} Performers`}
            subtitle={`${state.metrics.testsCount} Tests`}
            rightContent={
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, isPopupOpen: true }))
                }
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All
              </button>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={state.topScorers.map((item) => ({
                  name: item.userName,
                  maxScore: item[`${state.timePeriod}_maxScore`],
                }))}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.cartesianGrid}
                />
                <XAxis dataKey="name" stroke={chartColors.axisText} />
                <YAxis stroke={chartColors.axisText} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#1f2937",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="maxScore"
                  fill={chartColors.scoresBar}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Test Timeline Chart */}
          <ChartContainer title="Your Test Timeline">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={state.currUserRecord?.tests}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.cartesianGrid}
                />
                <XAxis dataKey="date" stroke={chartColors.axisText} />
                <YAxis stroke={chartColors.axisText} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#1f2937",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={chartColors.testsBar}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Questions Timeline Chart */}
          <ChartContainer title="Your Questions Timeline">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={state.currUserRecord?.questions}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.cartesianGrid}
                />
                <XAxis dataKey="date" stroke={chartColors.axisText} />
                <YAxis stroke={chartColors.axisText} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#1f2937",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={chartColors.questionsBar}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Scores Timeline Chart */}
          <ChartContainer title="Your Scores Timeline">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={state.currUserRecord?.scores}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.cartesianGrid}
                />
                <XAxis dataKey="date" stroke={chartColors.axisText} />
                <YAxis stroke={chartColors.axisText} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#1f2937",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value, name, props) => [
                    `Percent: ${value}%`,
                    `Paper ID: ${props.payload.paperId}`,
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke={chartColors.scoreLine}
                  strokeWidth={2}
                  dot={{ fill: chartColors.scoreLine, r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Pop-up for Today's Tests */}
        <TodaysTestsPopup
          timePeriod={state.timePeriod}
          data={state.testsToday}
          isOpen={state.isPopupOpen}
          onClose={() => setState((prev) => ({ ...prev, isPopupOpen: false }))}
        />
      </div>
    </div>
  );
};

export default Dashboard;
