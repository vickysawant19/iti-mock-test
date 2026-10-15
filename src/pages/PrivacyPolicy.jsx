import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Trash2,
  Bell,
  Mail,
  GraduationCap,
  FileCheck,
  ArrowLeft,
} from "lucide-react";
import Footer from "@/components/navbar/Footer";

const PrivacyPolicy = () => {
  const lastUpdated = "October 14, 2026";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 flex flex-col justify-between transition-colors duration-200">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation & Header */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline gap-1 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Privacy Policy
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ITI Mitra Platform & Android Mobile Application
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
              <strong>Effective Date:</strong> {lastUpdated}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-6">
          {/* Section 1: Overview */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2>1. Introduction & Scope</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              Welcome to <strong>ITI Mitra</strong> ("we," "our," or "us"). ITI Mitra is an educational platform available at{" "}
              <a
                href="https://itimitra.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline font-medium"
              >
                https://itimitra.in
              </a>{" "}
              and as an Android Mobile Application. Our mission is to empower Industrial Training Institute (ITI) students and instructors across vocational trades with mock tests, computerized assessment, daily diaries, and academic attendance tracking.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base mt-3">
              We respect your privacy and are committed to protecting any personal data you share with us. This Privacy Policy explains what information we collect, how it is used and secured, and how you can manage or delete your data.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2>2. Information We Collect</h2>
            </div>
            <div className="space-y-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  A. Account & Academic Profile Information
                </h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Full Name and Email Address (used for authentication).</li>
                  <li>Role (Student, Teacher, or Administrator).</li>
                  <li>ITI College name, Trade/Branch (e.g., Electrician, Fitter, COPA), and Academic Batch/Year.</li>
                  <li>Profile avatar or uploaded photo (optional).</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  B. Academic Progress & Test Data
                </h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Mock test submissions, answers, scores, and completion times.</li>
                  <li>Daily diary entries and personal academic attendance records.</li>
                  <li>Batch enrollment requests and approvals.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  C. Device & Technical Information
                </h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Device model, operating system version, and unique installation ID.</li>
                  <li>IP address, browser or WebView type, and error/crash diagnostics to maintain app stability.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Android Device Permissions */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              <Bell className="w-5 h-5 text-amber-500" />
              <h2>3. Android App Device Permissions</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed mb-3">
              The ITI Mitra Android app may request runtime permissions solely to provide specific features:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              <li>
                <strong>Push Notifications (<code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">POST_NOTIFICATIONS</code>):</strong> To notify you when new mock exams are published, batch announcements are made, or attendance is updated.
              </li>
              <li>
                <strong>Camera / Storage (Optional):</strong> If you choose to upload a profile photo or attach an image to an exam question.
              </li>
              <li>
                <strong>Network Access (<code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">INTERNET</code>):</strong> To sync your test progress and attendance records with our secure cloud servers.
              </li>
            </ul>
          </section>

          {/* Section 4: How We Use Data */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2>4. How We Use Your Information</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              <li>To provide and maintain the ITI Mitra services.</li>
              <li>To compute exam scores, generate performance analytics, and present summary reports.</li>
              <li>To enable instructors to track batch attendance and student participation.</li>
              <li>To detect and prevent fraudulent test attempts, abuse, or technical errors.</li>
              <li>We <strong>do not sell, rent, or trade</strong> your personal information to third-party advertisers.</li>
            </ul>
          </section>

          {/* Section 5: Security & Third Parties */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              <Lock className="w-5 h-5 text-red-500 dark:text-red-400" />
              <h2>5. Data Security & Third-Party Service Providers</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed mb-3">
              All communications between your device and our servers are encrypted using industry-standard TLS/HTTPS protocols. We rely on reputable infrastructure providers:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              <li>
                <strong>Appwrite:</strong> Provides secure backend database storage, session management, and role-based access control.
              </li>
              <li>
                <strong>Google Play Services:</strong> Core application delivery, crash reporting, and Android push notifications.
              </li>
            </ul>
          </section>

          {/* Section 6: Data Retention & Account Deletion */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h2>6. Data Retention & Account Deletion Rights</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed mb-3">
              We retain your academic records as long as your account is active to preserve your test history. You have the right to request deletion of your account and all associated personal data at any time.
            </p>
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-sm text-rose-900 dark:text-rose-200">
              <p className="font-semibold mb-1">How to Request Account & Data Deletion:</p>
              <p>
                Email us at{" "}
                <a
                  href="mailto:vitthal.sawant19@gmail.com?subject=ITI%20Mitra%20Account%20Deletion%20Request"
                  className="font-medium underline"
                >
                  vitthal.sawant19@gmail.com
                </a>{" "}
                or{" "}
                <a
                  href="mailto:admin@itimitra.in?subject=ITI%20Mitra%20Account%20Deletion%20Request"
                  className="font-medium underline"
                >
                  admin@itimitra.in
                </a>{" "}
                with the subject line <em>"Account Deletion Request"</em> from your registered email address. We will verify your identity and delete your profile and test submissions within 7 working days.
              </p>
            </div>
          </section>

          {/* Section 7: Student and Minors Privacy */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              <Database className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2>7. Student and Minor Privacy</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
              ITI Mitra is intended for vocational trainees and students (typically aged 14 and older) enrolled in ITI programs. We do not intentionally collect personal information from children under 13. If you believe a child under 13 has registered without parental or institutional consent, please contact us immediately so we can remove their information.
            </p>
          </section>

          {/* Section 8: Contact Us */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2>8. Contact & Grievance Officer</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your data, please contact:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl text-sm space-y-1">
              <p className="font-semibold text-gray-900 dark:text-white">Vitthal Sawant</p>
              <p className="text-gray-600 dark:text-gray-300">Founder & Developer, ITI Mitra</p>
              <p className="text-gray-600 dark:text-gray-300">
                Email:{" "}
                <a
                  href="mailto:vitthal.sawant19@gmail.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  vitthal.sawant19@gmail.com
                </a>{" "}
                /{" "}
                <a
                  href="mailto:admin@itimitra.in"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  admin@itimitra.in
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-300">Website: https://itimitra.in</p>
              <p className="text-gray-600 dark:text-gray-300">Maharashtra, India</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
