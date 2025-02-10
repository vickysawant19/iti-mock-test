import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Award, CheckCircle, AlertCircle } from "lucide-react";

const MockTestGreet = ({ mockTest, handleStartExam }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute h-20 w-20 rounded-full bg-blue-200 opacity-20 animate-float top-20 left-10" />
        <div className="absolute h-32 w-32 rounded-full bg-indigo-200 opacity-20 animate-float-delay top-40 right-20" />
        <div className="absolute h-24 w-24 rounded-full bg-purple-200 opacity-20 animate-float-slow bottom-20 left-1/4" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 w-full max-w-lg mx-auto transform transition-all hover:scale-102">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <BookOpen className="w-12 h-12 mx-auto text-indigo-600 animate-pulse" />
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome to the Mock Test
              </h1>
            </div>

            {/* Main content */}
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span className="text-lg font-semibold text-gray-700">
                  Duration: 1 hour
                </span>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-indigo-600" />
                  Exam Rules
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Number of Questions: {mockTest?.quesCount || 50}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Each question carries equal marks</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>No negative marking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Ensure you are in a quiet environment</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-start bg-amber-50 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 mr-2 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  Make sure you have read all instructions carefully before
                  starting the exam. Good luck!
                </p>
              </div>

              <button
                onClick={() => handleStartExam()}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold 
                          transition-all hover:bg-indigo-700 active:scale-95 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Start Test
              </button>
            </div>
          </div>
        </div>
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
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default MockTestGreet;
