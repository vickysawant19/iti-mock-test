import React from "react";
import Footer from "@/components/navbar/Footer";
import { APP_VERSION, BUILD_DATE } from "@/config/version";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  GraduationCap,
  Globe2,
  Gamepad2,
  CalendarCheck,
  Mail,
  Zap,
  Layers,
} from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="rounded-3xl p-6 sm:p-10 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-200 dark:border-blue-800 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ITI Mitra 2.0 Platform
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              About ITI Mitra
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              A comprehensive vocational training ecosystem empowering ITI students, instructors, and administrators with smart mock testing, attendance geofencing, and gamified learning.
            </p>
          </div>

          {/* Mission */}
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                <GraduationCap className="w-5 h-5" /> Our Mission
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Bridging Classroom Practice with Modern Industry Standards
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Our mission is to provide vocational trainees with state-of-the-art preparation tools. Regular practice, instant automated scoring, and real-world mock exams ensure students secure top scores and master trade competencies with confidence.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              {[
                { icon: <Globe2 className="w-5 h-5 text-blue-500" />, title: "Bilingual Engine", desc: "Native English & Marathi" },
                { icon: <Gamepad2 className="w-5 h-5 text-pink-500" />, title: "Game Arena", desc: "Quests, XP & Streaks" },
                { icon: <CalendarCheck className="w-5 h-5 text-emerald-500" />, title: "GPS Attendance", desc: "Geofenced Verification" },
                { icon: <Zap className="w-5 h-5 text-amber-500" />, title: "Live Feedback", desc: "Instant automated results" },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 w-fit">{item.icon}</div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Core Features */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-purple-500" /> Platform Highlights
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Personalized test environments with timer controls and auto-submission",
                "Full Schema Version 2.0 multilingual question paper support",
                "Teacher dashboards for batch management, attendance registers, and daily diaries",
                "Student progression analytics, score cards, and rank tracking",
                "Gamified quests, daily wheel spins, and avatar customization in Game Arena",
                "Geofenced campus GPS verification for secure daily attendance logging"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* About Creator */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-800/60 dark:to-slate-800/30 border border-blue-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Created & Maintained By
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Vitthal (Vicky) Sawant
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                Dedicated to modernizing technical and vocational training workflows through thoughtful digital architecture, robust software engineering, and accessible design.
              </p>
            </div>
            <a
              href="mailto:vitthal.sawant19@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all hover:scale-105 shrink-0"
            >
              <Mail className="w-4 h-4" /> Contact Creator
            </a>
          </div>

          {/* Dedicated Version 2.0 Release Section */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-500" /> System & Version Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Official build and release specifications for ITI Mitra.
                </p>
              </div>

              {/* Version Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">Version {APP_VERSION}</span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-slate-600 dark:text-slate-400">Release 2.0</span>
              </div>
            </div>

            {/* Version 2.0 Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Application Version</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">v{APP_VERSION}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Release Track</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">2.0 Production</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Release / Build Date</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{BUILD_DATE}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Question Engine</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">Schema 2.0</span>
              </div>
            </div>

            {/* Verification Status */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                You are currently running <strong>ITI Mitra Version 2.0</strong> ({APP_VERSION}). All features including bilingual exams, framer-motion interactions, and geofencing are fully operational.
              </p>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
