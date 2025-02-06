import React, { useState } from "react";
import {
  Brain,
  GraduationCap,
  BookOpen,
  Target,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      {/* Interactive Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse delay-300"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-4 pt-24 pb-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-white rounded-full px-4 py-2 mb-6 shadow-md">
              <Sparkles className="w-5 h-5 text-indigo-500 mr-2" />
              <span className="text-gray-600">
                Welcome to the Future of Education
              </span>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Master Your Academic Journey
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Experience a revolutionary approach to educational assessment and
              student management. Create tests, track progress, and elevate
              learning outcomes.
            </p>
          </div>

          {/* Interactive Feature Showcase */}
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-8">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: <Target className="w-6 h-6" />, title: "Mock Tests" },
                {
                  icon: <Brain className="w-6 h-6" />,
                  title: "Smart Assessment",
                },
                {
                  icon: <BookOpen className="w-6 h-6" />,
                  title: "Question Bank",
                },
              ].map((feature, idx) => (
                <button
                  key={idx}
                  className={`p-4 rounded-xl flex items-center justify-center transition-all ${
                    activeFeature === idx
                      ? "bg-indigo-600 text-white shadow-lg scale-105"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveFeature(idx)}
                >
                  {feature.icon}
                  <span className="ml-2 font-medium">{feature.title}</span>
                </button>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 min-h-[300px]">
              {activeFeature === 0 && (
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Create Custom Mock Tests
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Timed assessments",
                        "Multiple question types",
                        "Instant results",
                        "Performance analytics",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center">
                          <ChevronRight className="w-4 h-4 text-indigo-600 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">
                    <img
                      src="/api/placeholder/400/300"
                      alt="Mock Test Interface"
                      className="rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}
              {activeFeature === 1 && (
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Intelligent Assessment System
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Automated grading",
                        "Progress tracking",
                        "Performance insights",
                        "Question analysis",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center">
                          <ChevronRight className="w-4 h-4 text-indigo-600 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">
                    <img
                      src="/api/placeholder/400/300"
                      alt="Assessment Dashboard"
                      className="rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}
              {activeFeature === 2 && (
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Extensive Question Bank
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Categorized questions",
                        "Difficulty levels",
                        "Quick search",
                        "Custom collections",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center">
                          <ChevronRight className="w-4 h-4 text-indigo-600 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">
                    <img
                      src="/api/placeholder/400/300"
                      alt="Question Bank"
                      className="rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Experience the Power of Smart Testing
          </h2>
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-indigo-100"></div>
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { title: "Create Test", icon: <Target className="w-8 h-8" /> },
                {
                  title: "Add Questions",
                  icon: <BookOpen className="w-8 h-8" />,
                },
                {
                  title: "Share Access",
                  icon: <GraduationCap className="w-8 h-8" />,
                },
                {
                  title: "Track Progress",
                  icon: <Brain className="w-8 h-8" />,
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="relative bg-white rounded-xl p-6 text-center"
                >
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Ready to Get Started?
          </h2>
          <button className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg">
            Enter Platform
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
