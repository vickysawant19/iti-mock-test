import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Book,
  FileText,
  LineChart,
  UserCircle,
  Briefcase,
  Clock,
  Target,
  FolderCheck,
  BarChart2,
  Users,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  BarChart3,
  PieChart,
  Activity,
  ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import logo from "@/assets/itimitra-logo.png"; // Assuming logo exists based on navbar

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const Home = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isLoggedIn = !!user;

  const features = [
    {
      icon: <CalendarCheck className="w-8 h-8" />,
      title: "Attendance Management",
      desc: "Track daily presence with ease, verify geolocations, and maintain precise student and staff records.",
      color: "blue",
    },
    {
      icon: <Book className="w-8 h-8" />,
      title: "Daily Diary",
      desc: "Log daily teaching activities and practical work comprehensively in a centralized digital format.",
      color: "green",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Mock Test System",
      desc: "Conduct scalable mock tests with automated grading and instant result publishing for trainees.",
      color: "purple",
    },
    {
      icon: <LineChart className="w-8 h-8" />,
      title: "Student Progress Tracking",
      desc: "Visualize learning curves with powerful analytics and dynamically generated performance scorecards.",
      color: "amber",
    },
    {
      icon: <UserCircle className="w-8 h-8" />,
      title: "Teacher Records",
      desc: "Streamline staff management, track assignments, and maintain comprehensive professional histories.",
      color: "rose",
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "Job & Skill Evaluation",
      desc: "Evaluate practical jobs with custom grading metrics and generate professional PDF reports instantly.",
      color: "cyan",
    },
  ];

  const roles = [
    {
      title: "Admin Panel",
      icon: <ShieldCheck className="w-10 h-10 text-slate-700 dark:text-slate-200" />,
      desc: "Full oversight of the institution.",
      features: ["Manage branches & trades", "Oversee all users", "System configurations"],
      bg: "bg-slate-100 dark:bg-slate-800",
    },
    {
      title: "Teacher Dashboard",
      icon: <UserCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />,
      desc: "Tools to empower educators.",
      features: ["Create & grade mock tests", "Log daily diaries", "Evaluate practical jobs"],
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      title: "Student Portal",
      icon: <GraduationCap className="w-10 h-10 text-green-600 dark:text-green-400" />,
      desc: "A personalized learning hub.",
      features: ["Take mock exams", "View attendance", "Track performance scores"],
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
    },
  ];

  const benefits = [
    { icon: <Clock className="w-6 h-6" />, title: "Save Time" },
    { icon: <Target className="w-6 h-6" />, title: "Improve Accuracy" },
    { icon: <FolderCheck className="w-6 h-6" />, title: "Easy Record Keeping" },
    { icon: <BarChart2 className="w-6 h-6" />, title: "Data-Driven Decisions" },
  ];

  const colorVariants = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
    cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
      
      {/* 1. Hero Section */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden bg-white dark:bg-slate-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-20 opacity-40"></div>
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold mb-8 border border-blue-100 dark:border-blue-800 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
              ITI Management Platform 2.0
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight"
            >
              Smart ITI Management <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-400">
                Made Simple
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Manage attendance, track student progress, conduct mock tests, and streamline teacher records — all in one modern platform.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => navigate(isLoggedIn ? "/dash" : "/signup")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-bold shadow-[0_8px_30px_rgb(37,99,235,0.24)] transition-all hover:-translate-y-1"
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started"} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              {!isLoggedIn && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="px-8 py-6 rounded-xl text-lg font-bold border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:-translate-y-1"
                >
                  Login
                </Button>
              )}
            </motion.div>
          </div>

          {/* Hero Dashboard CSS Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="mt-20 max-w-5xl mx-auto relative perspective-1000"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-green-400 rounded-[2.5rem] blur-xl opacity-20 dark:opacity-40"></div>
            <div className="relative bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
              {/* Mockup Header */}
              <div className="h-12 bg-white/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto bg-white dark:bg-slate-950 px-32 py-1 rounded-md text-xs text-slate-400 border border-slate-100 dark:border-slate-800 flex items-center gap-2 shadow-inner">
                  <ShieldCheck className="w-3 h-3" /> itimitra.in/dashboard
                </div>
              </div>
              
              {/* Mockup Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-900/50">
                {/* Sidebar Mock */}
                <div className="hidden md:flex flex-col gap-3">
                  <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-md mb-4"></div>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-10 w-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center px-3 gap-3">
                      <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700"></div>
                      <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700"></div>
                    </div>
                  ))}
                </div>
                
                {/* Main Content Mock */}
                <div className="md:col-span-2 space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="h-6 w-48 bg-slate-800 dark:bg-slate-200 rounded-md mb-2"></div>
                      <div className="h-4 w-32 bg-slate-400 dark:bg-slate-500 rounded-md"></div>
                    </div>
                    <div className="h-10 w-32 bg-blue-600 rounded-xl shadow-sm"></div>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4">
                     {[
                       { color: 'from-blue-500 to-blue-600', w: 'w-16' }, 
                       { color: 'from-green-500 to-green-600', w: 'w-24' }, 
                       { color: 'from-purple-500 to-purple-600', w: 'w-12' }
                     ].map((stat, i) => (
                       <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
                          <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${stat.color} mb-3`}></div>
                          <div className="h-6 w-12 bg-slate-800 dark:bg-slate-200 rounded-md mb-2"></div>
                          <div className={`h-3 ${stat.w} bg-slate-300 dark:bg-slate-600 rounded-full`}></div>
                       </div>
                     ))}
                  </div>

                  {/* Chart/Table Area */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 h-48 flex flex-col justify-end gap-2">
                    <div className="flex gap-2 items-end h-full px-4 pb-2">
                      {[40, 70, 45, 90, 65, 85, 50, 100].map((h, i) => (
                        <div key={i} className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-sm relative group">
                          <div className="absolute bottom-0 w-full bg-blue-500 dark:bg-blue-500 rounded-t-sm transition-all duration-500 hover:bg-blue-400" style={{ height: `${h}%` }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Features Section (Grid Cards) */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful Features for Every Need
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything you need to run your institution efficiently, from attendance tracking to complex evaluations.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {features.map((feature, idx) => (
              <motion.div key={idx} variants={fadeInUp} whileHover={{ y: -8 }} transition={{ duration: 0.2 }}>
                <Card className="h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", colorVariants[feature.color])}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3. Dashboard Preview Section */}
      <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
         <div className="container mx-auto px-4">
           <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
             
             {/* Text Content */}
             <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-semibold mb-6 border border-green-100 dark:border-green-800">
                  <Activity className="w-4 h-4" /> Real-time Insights
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  Track performance in <br className="hidden md:block"/>
                  <span className="text-blue-600 dark:text-blue-400">real-time</span>
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  A simple and powerful dashboard gives you a bird's-eye view of your institution. Monitor attendance trends, analyze mock test scores, and review daily teaching logs instantly.
                </p>
                <ul className="space-y-4 mb-8">
                  {["Interactive Attendance Tables", "Visual Student Performance Charts", "Comprehensive Teacher Logs"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
             </div>

             {/* UI Showcase */}
             <div className="relative">
                {/* Floating Label 1 */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="absolute -left-12 top-10 z-20 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 hidden md:flex"
                >
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full text-blue-600 dark:text-blue-400"><PieChart className="w-5 h-5"/></div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Average Score</p>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">86.4%</p>
                  </div>
                </motion.div>

                {/* Floating Label 2 */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute -right-8 bottom-20 z-20 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 hidden md:flex"
                >
                  <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full text-green-600 dark:text-green-400"><Users className="w-5 h-5"/></div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Attendance</p>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">94.2%</p>
                  </div>
                </motion.div>

                <div className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
                   <div className="flex justify-between items-center mb-6">
                      <div className="font-bold text-slate-800 dark:text-white">Recent Logs</div>
                      <div className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border border-slate-200 dark:border-slate-700">This Week</div>
                   </div>
                   <div className="space-y-4">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/60">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                             {String.fromCharCode(64 + i)}
                           </div>
                           <div>
                             <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                             <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                           </div>
                         </div>
                         <div className="h-6 w-16 bg-green-100 dark:bg-green-900/40 rounded-full"></div>
                       </div>
                     ))}
                   </div>
                </div>
             </div>

           </div>
         </div>
      </section>

      {/* 4. User Roles Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Designed for Everyone
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Dedicated tools and interfaces tailored to the specific needs of administrators, teachers, and students.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {roles.map((role, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <Card className={cn("h-full border-2 transition-all hover:shadow-xl", role.bg, role.border || "border-slate-200 dark:border-slate-700")}>
                  <CardContent className="p-8">
                    <div className="mb-6 bg-white dark:bg-slate-950 w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-slate-800">
                      {role.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{role.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">{role.desc}</p>
                    
                    <ul className="space-y-3">
                      {role.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                          <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Benefits Section */}
      <section className="py-16 bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100 dark:divide-slate-800">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{benefit.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Call to Action Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-gradient-to-r from-blue-600 to-green-500 rounded-[2.5rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                Start Managing Your ITI Smarter Today
              </h2>
              <p className="text-xl text-blue-50 mb-10 max-w-2xl mx-auto opacity-90">
                Join our platform to streamline administrative tasks, empower teachers, and boost student success.
              </p>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/signup")}
                  className="bg-white text-blue-600 hover:bg-slate-50 px-10 py-7 text-xl font-bold rounded-2xl shadow-xl transition-all"
                >
                  Create Free Account
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer Section */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src={logo} alt="ITI Mitra Logo" className="w-10 h-10 object-contain" />
                <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
                  ITI Mitra
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                The complete management platform designed specifically for Industrial Training Institutes.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Features</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">About Us</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Mock Tests</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Tutorials</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center md:text-left">
              &copy; {new Date().getFullYear()} ITI Mitra. All Rights Reserved.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
              Made with <span className="text-red-500">♥</span> for Education
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
