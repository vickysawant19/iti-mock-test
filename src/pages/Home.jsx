import React from "react";
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
  ArrowRight,
  Laptop,
  Award,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

import heroImg from "@/assets/hero-student-mobile.png";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const FeatureCard = ({ feature, borderColor, bgColor, iconColor }) => (
  <motion.div variants={fadeIn} className="h-full">
    <Card
      className={cn(
        "h-full hover:shadow-xl transition-all duration-300 border-t-4 group hover:-translate-y-1",
        `border-t-${borderColor}`,
        "dark:bg-slate-900 dark:border-slate-800 bg-white"
      )}
    >
      <CardContent className="pt-8 px-6 pb-6">
        <div
          className={cn(
            "mb-6 p-3 rounded-2xl w-14 h-14 flex items-center justify-center transition-transform group-hover:scale-110",
            `bg-${bgColor}`,
            `dark:bg-${borderColor}/10`
          )}
        >
          {React.cloneElement(feature.icon, {
            className: cn("w-7 h-7", iconColor),
          })}
        </div>
        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {feature.title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {feature.desc}
        </p>
      </CardContent>
    </Card>
  </motion.div>
);

const StepCard = ({ step, index }) => (
  <motion.div
    variants={fadeIn}
    className="relative h-full"
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
  >
    <Card className="relative bg-white dark:bg-slate-900 rounded-2xl p-8 text-center shadow-sm hover:shadow-lg border-slate-100 dark:border-slate-800 h-full transition-all">
      <CardContent className="pt-2 flex flex-col items-center">
        <div className="relative z-10 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transform rotate-3 group-hover:rotate-6 transition-transform">
            {step.icon}
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900 border-2 border-white dark:border-slate-900">
            {index + 1}
          </div>
        </div>
        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
          {step.title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {step.desc}
        </p>
      </CardContent>
    </Card>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  const studentFeatures = [
    {
      icon: <Calendar />,
      title: "Smart Attendance",
      desc: "Mark attendance with geolocation verification. Keep track of your daily presence effortlessly.",
    },
    {
      icon: <Laptop />,
      title: "Online Mock Tests",
      desc: "Practice with realistic mock exams. Get instant feedback and detailed performance analysis.",
    },
    {
      icon: <BarChart />,
      title: "Progress Analytics",
      desc: "Visualize your learning curve with detailed charts and personalized insights.",
    },
  ];

  const teacherFeatures = [
    {
      icon: <Edit />,
      title: "Test Creation Suite",
      desc: "Design comprehensive mock tests with various question types and difficulty levels.",
    },
    {
      icon: <Eye />,
      title: "Real-time Monitoring",
      desc: "Monitor student attendance and test performance in real-time from a centralized dashboard.",
    },
    {
      icon: <Users />,
      title: "Batch Management",
      desc: "Efficiently manage student batches, track progress, and generate detailed reports.",
    },
  ];

  const steps = [
    {
      title: "Create Account",
      icon: <Users className="w-8 h-8" />,
      desc: "Sign up in seconds and choose your role as a student or teacher.",
    },
    {
      title: "Complete Profile",
      icon: <Shield className="w-8 h-8" />,
      desc: "Set up your academic profile and preferences for a personalized experience.",
    },
    {
      title: "Start Learning",
      icon: <BookOpen className="w-8 h-8" />,
      desc: "Access mock tests, track attendance, and engage with learning materials.",
    },
    {
      title: "Achieve Goals",
      icon: <Award className="w-8 h-8" />,
      desc: "Track your progress, improve your scores, and reach your academic targets.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 pb-16 pt-10 lg:pb-32 lg:pt-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4 relative"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <motion.div 
                variants={fadeIn}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6 border border-blue-100 dark:border-blue-800"
              >
                <Sparkles className="w-4 h-4" />
                <span>#1 Platform for ITI Students</span>
              </motion.div>

              <motion.h1
                variants={fadeIn}
                transition={{ delay: 0.2 }}
                className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]"
              >
                Master Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  ITI Exams
                </span>{" "}
                Today
              </motion.h1>

              <motion.p
                variants={fadeIn}
                transition={{ delay: 0.3 }}
                className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0"
              >
                The ultimate platform for ITI students to practice mock tests, track attendance, and boost exam performance. Join thousands of successful students.
              </motion.p>

              <motion.div 
                variants={fadeIn} 
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-xl text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-1"
                >
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-8 py-6 rounded-xl text-lg"
                >
                  Login to Account
                </Button>
              </motion.div>

              <motion.div
                variants={fadeIn}
                transition={{ delay: 0.5 }}
                className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 dark:text-slate-400 font-medium"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Latest Syllabus</span>
                </div>
              </motion.div>
            </div>

            {/* Hero Image */}
            <motion.div
              variants={fadeIn}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="relative lg:h-[600px] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-3xl opacity-60 animate-pulse"></div>
              <img
                src={heroImg}
                alt="Students taking online test"
                className="relative z-10 w-full max-w-lg lg:max-w-full rounded-2xl shadow-2xl shadow-blue-900/20 transform hover:scale-[1.02] transition-transform duration-500"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Feature Showcase */}
      <div className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Powerful tools designed specifically for the ITI curriculum to help students succeed and teachers manage effectively.
            </p>
          </div>

          <Tabs defaultValue="student" className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm">
                <TabsTrigger
                  value="student"
                  className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white py-2.5 font-medium transition-all"
                >
                  For Students
                </TabsTrigger>
                <TabsTrigger
                  value="teacher"
                  className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white py-2.5 font-medium transition-all"
                >
                  For Teachers
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="student">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {studentFeatures.map((feature, idx) => (
                  <FeatureCard
                    key={idx}
                    feature={feature}
                    borderColor="blue-500"
                    bgColor="blue-50"
                    iconColor="text-blue-600 dark:text-blue-400"
                  />
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="teacher">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {teacherFeatures.map((feature, idx) => (
                  <FeatureCard
                    key={idx}
                    feature={feature}
                    borderColor="indigo-500"
                    bgColor="indigo-50"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                  />
                ))}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 bg-white dark:bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Your Path to Success
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Get started in four simple steps and transform your learning experience.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 hidden md:block -translate-y-1/2 rounded-full"></div>
            
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10"
            >
              {steps.map((step, idx) => (
                <StepCard key={idx} step={step} index={idx} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-24 bg-slate-50 dark:bg-slate-950"
      >
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-3xl p-8 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl text-blue-100 mb-10 leading-relaxed">
                Join thousands of ITI students who are already mastering their exams with our platform.
              </p>

              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Button
                  onClick={() => navigate("/signup")}
                  className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 px-10 py-7 text-xl font-bold rounded-xl shadow-lg"
                >
                  Create Free Account <ChevronRight className="ml-2 w-6 h-6" />
                </Button>
              </motion.div>
              
              <p className="mt-6 text-sm text-blue-200 font-medium">
                No credit card required • Free for students
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
