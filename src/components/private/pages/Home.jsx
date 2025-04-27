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
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Assuming you have this utility

import classroomImg from "../../../assets/Classroom.png";

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

const FeatureCard = ({ feature, borderColor, bgColor }) => (
  <motion.div variants={fadeIn}>
    <Card
      className={cn(
        "h-full hover:shadow-md transition-all duration-300 border-l-4",
        `border-l-${borderColor}`,
        "dark:bg-gray-800 dark:border-gray-700"
      )}
    >
      <CardContent className="pt-6">
        <div
          className={cn(
            "mb-4 p-2 rounded-full w-12 h-12 flex items-center justify-center",
            `bg-${bgColor}`,
            `dark:bg-${borderColor}/20`
          )}
        >
          {feature.icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 dark:text-white">
          {feature.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300">{feature.desc}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const StepCard = ({ step, index }) => (
  <motion.div
    variants={fadeIn}
    className="relative"
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
  >
    <Card className="relative bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow h-full">
      <CardContent className="pt-6 flex flex-col items-center">
        <div className="relative z-10 mb-4">
          <div className="w-14 h-14 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white">
            {step.icon}
          </div>
          <div className="absolute -top-1 -left-1 w-16 h-16 bg-blue-400 dark:bg-blue-400/50 rounded-full opacity-30 animate-pulse"></div>
        </div>
        <h3 className="text-xl font-semibold mb-2 dark:text-white">
          {step.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300">{step.desc}</p>

        <div className="mt-4 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium dark:text-blue-300">
          Step {index + 1}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const LandingPage = () => {
  const studentFeatures = [
    {
      icon: <Calendar className="w-6 h-6 text-blue-500 dark:text-blue-400" />,
      title: "Attendance Tracking",
      desc: "View and mark your attendance seamlessly.",
    },
    {
      icon: <Target className="w-6 h-6 text-blue-500 dark:text-blue-400" />,
      title: "Mock Tests",
      desc: "Take mock tests and track your progress.",
    },
    {
      icon: <BarChart className="w-6 h-6 text-blue-500 dark:text-blue-400" />,
      title: "Performance Analytics",
      desc: "Get insights into your learning journey.",
    },
  ];

  const teacherFeatures = [
    {
      icon: <Edit className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />,
      title: "Create Mock Tests",
      desc: "Design and share mock tests with ease.",
    },
    {
      icon: <Eye className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />,
      title: "View Results",
      desc: "Analyze student performance in real-time.",
    },
    {
      icon: <Users className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />,
      title: "Batch Management",
      desc: "Manage attendance and student records.",
    },
  ];

  const steps = [
    {
      title: "Sign Up",
      icon: <Users className="w-6 h-6" />,
      desc: "Create your account in minutes.",
    },
    {
      title: "Set Up Profile",
      icon: <GraduationCap className="w-6 h-6" />,
      desc: "Choose your role and preferences.",
    },
    {
      title: "Explore Features",
      icon: <BookOpen className="w-6 h-6" />,
      desc: "Access tools tailored to your needs.",
    },
    {
      title: "Track Progress",
      icon: <BarChart className="w-6 h-6" />,
      desc: "Monitor growth and achievements.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 pt-20 pb-16 relative"
      >
        <div className="text-center max-w-3xl mx-auto">
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1.5 bg-white dark:bg-gray-800 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium dark:text-gray-200">
              Revolutionizing Education
            </span>
          </Badge>

          <motion.h1
            variants={fadeIn}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
          >
            Empower Your Learning Journey
          </motion.h1>

          <motion.p
            variants={fadeIn}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
          >
            A comprehensive LMS platform for attendance, mock tests, batch
            management, and more. Designed for students and teachers to thrive.
          </motion.p>

          <motion.div variants={fadeIn} transition={{ delay: 0.4 }}>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium px-8 py-6 rounded-lg text-lg shadow-lg"
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        {/* Hero Image */}
        <motion.div
          variants={fadeIn}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-12 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl"></div>
          <img
            src={classroomImg}
            alt="Education Platform"
            className="rounded-xl shadow-xl object-cover  "
          />
        </motion.div>
      </motion.div>

      {/* Feature Showcase */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 dark:text-white"
          >
            Features Tailored for You
          </motion.h2>

          <Tabs defaultValue="student" className="w-full max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2 dark:bg-gray-800">
                <TabsTrigger
                  value="student"
                  className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 dark:text-white"
                >
                  For Students
                </TabsTrigger>
                <TabsTrigger
                  value="teacher"
                  className="data-[state=active]:bg-indigo-100 dark:data-[state=active]:bg-indigo-900/30 dark:text-white"
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
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {studentFeatures.map((feature, idx) => (
                  <FeatureCard
                    key={idx}
                    feature={feature}
                    borderColor="blue-500"
                    bgColor="blue-50"
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
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {teacherFeatures.map((feature, idx) => (
                  <FeatureCard
                    key={idx}
                    feature={feature}
                    borderColor="indigo-500"
                    bgColor="indigo-50"
                  />
                ))}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 dark:text-white"
          >
            How It Works
          </motion.h2>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-100 dark:bg-blue-900/50 hidden md:block"></div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-4 gap-8"
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
        className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 py-16"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Join the Future of Education
          </h2>

          <Alert className="max-w-xl mx-auto mb-8 bg-white/10 text-white border-white/20">
            <AlertTitle className="text-white">Get Early Access</AlertTitle>
            <AlertDescription className="text-white/80">
              Sign up now and receive 3 months free access to premium features.
            </AlertDescription>
          </Alert>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 px-8 py-6 text-lg font-medium"
            >
              Sign Up Now <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
