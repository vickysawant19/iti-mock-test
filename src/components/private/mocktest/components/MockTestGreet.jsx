import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Award, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";

const MockTestGreet = ({ mockTest, handleStartExam }) => {
  function toHoursAndMinutes(totalMinutes = 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} Hours ${minutes} Minutes`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute h-20 w-20 rounded-full bg-blue-200 dark:bg-blue-800 opacity-20 animate-float top-20 left-10" />
        <div className="absolute h-32 w-32 rounded-full bg-indigo-200 dark:bg-indigo-800 opacity-20 animate-float-delay top-40 right-20" />
        <div className="absolute h-24 w-24 rounded-full bg-purple-200 dark:bg-purple-800 opacity-20 animate-float-slow bottom-20 left-1/4" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl p-6 w-full max-w-lg mx-auto transform transition-all hover:scale-105">
          <CardContent className="space-y-6 p-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <BookOpen className="w-12 h-12 mx-auto text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Welcome to the Mock Test
              </h1>
            </div>

            {/* Main content */}
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Duration: {toHoursAndMinutes(mockTest?.totalMinutes)}
                </span>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Exam Rules
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                    <span className="dark:text-gray-300">
                      Number of Questions: {mockTest?.quesCount || 50}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                    <span className="dark:text-gray-300">
                      Each question carries equal marks
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                    <span className="dark:text-gray-300">
                      No negative marking
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                    <span className="dark:text-gray-300">
                      Ensure you are in a quiet environment
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex items-start bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Make sure you have read all instructions carefully before
                  starting the exam. Good luck!
                </p>
              </div>

              <Button
                onClick={() => handleStartExam()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white py-3 px-6"
              >
                Start Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MockTestGreet;
