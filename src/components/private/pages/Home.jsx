import React, { useState } from "react";
import {
  Brain,
  GraduationCap,
  BookOpen,
  Target,
  Sparkles,
  ChevronRight,
  Users,
  Calendar,
  CheckCircle,
  BarChart,
  Edit,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import img from '../../../assets/teachers.jpg'


const LandingPage = () => {
  const [activeRole, setActiveRole] = useState("student");

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-300"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-4 pt-24 pb-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-white rounded-full px-4 py-2 mb-6 shadow-md">
              <Sparkles className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-gray-600">
                Revolutionizing Education for Students & Teachers
              </span>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Empower Your Learning Journey
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              A comprehensive LMS platform for attendance, mock tests, batch
              management, and more. Designed for students and teachers to thrive.
            </p>
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
              Get Started
            </button>
          </div>

          {/* AI-Generated Image Placeholder */}
          <div className="mt-12">
            <img
              src={img}
              alt="AI Generated Education Image"
              className="rounded-lg shadow-lg mx-auto"
            />
          </div>
        </div>
      </div>

      {/* Interactive Feature Showcase */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Features Tailored for You
          </h2>
          <div className="flex justify-center mb-8">
            <button
              className={`px-6 py-2 rounded-l-lg ${
                activeRole === "student"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
              onClick={() => setActiveRole("student")}
            >
              Students
            </button>
            <button
              className={`px-6 py-2 rounded-r-lg ${
                activeRole === "teacher"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
              onClick={() => setActiveRole("teacher")}
            >
              Teachers
            </button>
          </div>

          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {activeRole === "student" && (
              <>
                {[
                  {
                    icon: <Calendar className="w-8 h-8 text-blue-500" />,
                    title: "Attendance Tracking",
                    desc: "View and mark your attendance seamlessly.",
                  },
                  {
                    icon: <Target className="w-8 h-8 text-blue-500" />,
                    title: "Mock Tests",
                    desc: "Take mock tests and track your progress.",
                  },
                  {
                    icon: <BarChart className="w-8 h-8 text-blue-500" />,
                    title: "Performance Analytics",
                    desc: "Get insights into your learning journey.",
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </>
            )}
            {activeRole === "teacher" && (
              <>
                {[
                  {
                    icon: <Edit className="w-8 h-8 text-indigo-500" />,
                    title: "Create Mock Tests",
                    desc: "Design and share mock tests with ease.",
                  },
                  {
                    icon: <Eye className="w-8 h-8 text-indigo-500" />,
                    title: "View Results",
                    desc: "Analyze student performance in real-time.",
                  },
                  {
                    icon: <Users className="w-8 h-8 text-indigo-500" />,
                    title: "Batch Management",
                    desc: "Manage attendance and student records.",
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-100"></div>
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  title: "Sign Up",
                  icon: <Users className="w-8 h-8" />,
                  desc: "Create your account in minutes.",
                },
                {
                  title: "Set Up Profile",
                  icon: <GraduationCap className="w-8 h-8" />,
                  desc: "Choose your role and preferences.",
                },
                {
                  title: "Explore Features",
                  icon: <BookOpen className="w-8 h-8" />,
                  desc: "Access tools tailored to your needs.",
                },
                {
                  title: "Track Progress",
                  icon: <BarChart className="w-8 h-8" />,
                  desc: "Monitor growth and achievements.",
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="relative bg-white rounded-xl p-6 text-center shadow-lg"
                >
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Join the Future of Education
          </h2>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg">
            Sign Up Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;