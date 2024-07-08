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
import { format } from "date-fns";
import questionpaperservice from "../../appwrite/mockTest";
import quesdbservice from "../../appwrite/database";

const Dashboard = () => {
  const user = useSelector((state) => state.user);
  const [questionsCreated, setQuestionsCreated] = useState([]);
  const [mockTests, setMockTests] = useState([]);
  const [scoreData, setScoreData] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user's mock tests
        const mockTestsData =
          await questionpaperservice.getQuestionPaperByUserId(user.$id);

        // Group questions by Month
        const groupedTests = groupByMonth(mockTestsData);

        // Convert grouped questions to the format required by the chart
        const formattedTests = Object.entries(groupedTests).map(
          ([date, count]) => ({
            month: date,
            tests: count,
          })
        );
        setMockTests(formattedTests);

        // Process data for graphs
        const formattedMockTests = mockTestsData.map((test) => ({
          name: format(new Date(test.$createdAt), "MMM dd, yyyy"),
          score: test.score || 0,
        }));

        setScoreData(formattedMockTests);

        // Fetch questions created by user
        const questionsCreatedData = await quesdbservice.getQuestionsByUser(
          user.$id
        );

        // Group questions by date
        const groupedQuestions = groupByDate(questionsCreatedData.documents);

        // Convert grouped questions to the format required by the chart
        const formattedQuestions = Object.entries(groupedQuestions).map(
          ([date, count]) => ({
            name: date,
            questions: count,
          })
        );

        setQuestionsCreated(formattedQuestions);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Function to group questions by date
  const groupByDate = (questions) => {
    const grouped = {};

    questions.map((ques) => {
      const date = format(new Date(ques.$createdAt), "MMM dd, yyyy");
      if (grouped[date]) {
        grouped[date] += 1;
      } else {
        grouped[date] = 1;
      }
    });

    return grouped;
  };

  const groupByMonth = (tests) => {
    const grouped = {};

    tests.map((test) => {
      const date = format(new Date(test.$createdAt), "MMM , yyyy");
      if (grouped[date]) {
        grouped[date] += 1;
      } else {
        grouped[date] = 1;
      }
    });

    return grouped;
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Questions Created */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Questions Created</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={questionsCreated}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="questions" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mock Tests Taken */}

        {/* Score Progress */}
        <div className="bg-white shadow-md rounded-lg p-4 col-span-1 md:col-span-2 xl:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Score Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Mock Tests Distribution */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">
            Mock Tests Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockTests}
                dataKey="tests"
                nameKey="month"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
              >
                {mockTests.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
