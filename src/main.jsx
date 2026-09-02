import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import { Buffer } from "buffer";
window.Buffer = Buffer;

import App from "./App.jsx";
import "./index.css";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { registerSW } from "virtual:pwa-register";
import { store } from "./store/store.js";

// Core layout guards
import ProtectedRoute from "./private/ProtectedRoute.jsx";
import ProtectedTeacherRoutes from "./private/ProtectedTeacherRoutes.jsx";
import ProtectedStudentBatchRoute from "./private/ProtectedStudentBatchRoute.jsx";
import ProtectedAdminRoutes from "./private/ProtectedAdminRoutes.jsx";

// ── Public Pages ──
const Home = lazy(() => import("./pages/Home.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Login = lazy(() => import("./Auth/Login.jsx"));
const Signup = lazy(() => import("./Auth/Signup.jsx"));
const ForgetPass = lazy(() => import("./Auth/ForgetPass.jsx"));
const ResetPass = lazy(() => import("./Auth/ResetPass.jsx"));
const ChangePassword = lazy(() => import("./Auth/changePassword.jsx"));
const QuotaExceeded = lazy(() => import("./pages/QuotaExceeded.jsx"));
const PageNotFound = lazy(() => import("./PageNotFound.jsx"));

// ── Onboarding & Profile ──
const OnboardingWizard = lazy(() => import("./components/onboarding/OnboardingWizard.jsx"));
const TeacherOnboardingWizard = lazy(() => import("./components/onboarding/teacher/TeacherOnboardingWizard.jsx"));
const BatchEnrollmentStatus = lazy(() => import("./pages/BatchEnrollmentStatus.jsx"));
const Profile = lazy(() => import("./private/profile/Profile.jsx"));
const ProfileView = lazy(() => import("./private/profile/ProfileView.jsx"));
const ProfileForm = lazy(() => import("./private/profile/ProfileForm.jsx"));

// ── Gamification ──
const GameArena = lazy(() => import("./pages/GameArena.jsx"));
const BrowseBatches = lazy(() => import("./private/student/BrowseBatches.jsx"));

// ── Mock Test System ──
const CreateQuestion = lazy(() => import("./private/mocktest/CreateQuestion.jsx"));
const ManageQuestions = lazy(() => import("./private/mocktest/ManageQuestions.jsx"));
const EditQuestion = lazy(() => import("./private/mocktest/EditQuestion.jsx"));
const CreateMockTestPage = lazy(() => import("./private/mocktest/CreateMockTest/index.jsx"));
const AllMockTests = lazy(() => import("./private/mocktest/AllMockTests.jsx"));
const StartMockTest = lazy(() => import("./private/mocktest/StartMockTest/index.jsx"));
const ShowMockTest = lazy(() => import("./private/mocktest/ShowMockTest.jsx"));
const AttainTest = lazy(() => import("./private/mocktest/AttainMockTest/index.jsx"));
const MockTestResults = lazy(() => import("./private/mocktest/MockTestResults.jsx"));
const ExamSummary = lazy(() => import("./private/mocktest/ExamSummary.jsx"));

// ── Teacher & Batch Management ──
const CreateBatch = lazy(() => import("./private/teacher/batch/create-batch/CreateBatch.jsx"));
const EditBatch = lazy(() => import("./private/teacher/batch/edit-batch/EditBatch.jsx"));
const ViewBatch = lazy(() => import("./private/teacher/batch/view-batch/ViewBatch.jsx"));
const AddStudents = lazy(() => import("./private/teacher/batch/manage-students/AddStudents.jsx"));

// ── Attendance & Academic ──
const DailyDiary = lazy(() => import("./private/Attendance/DailyDiary/DailyDiary.jsx"));
const Assessment = lazy(() => import("./private/assessment/Assessment.jsx"));
const AttendanceRegister = lazy(() => import("./private/Attendance/teacher/AttendanceRegister/AttendanceRegister.jsx"));
const AttendanceTracker = lazy(() => import("./private/Attendance/todaysAttendance.jsx"));
const StudentAttendancePage = lazy(() => import("./private/Attendance/student/PersonalAttendance/StudentAttendancePage.jsx"));
const CollegeAttendance = lazy(() => import("./private/collegeDashboard/CollegeAttendance.jsx"));

// ── Admin Panel ──
const Modules = lazy(() => import("./private/admin/Modules.jsx"));
const AddBulkQuestions = lazy(() => import("./private/admin/BulkOperations/AddBulkQuestions.jsx"));
const MigrationDashboard = lazy(() => import("./private/admin/MigrationDashboard.jsx"));
const ManageTrades = lazy(() => import("./private/admin/ManageTrades.jsx"));
const ManageColleges = lazy(() => import("./private/admin/ManageColleges.jsx"));
const NotificationTester = lazy(() => import("./private/admin/NotificationTester.jsx"));

// Disable PWA on the old domain to prevent it from hijacking redirects
// and force client-side redirect since the cached SW bypassed Vercel's redirect
if (window.location.hostname === "itimocktest.vercel.app") {
  const forceRedirect = () => {
    window.location.replace(
      "https://itimitra.in" + window.location.pathname + window.location.search,
    );
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        // Unregister all service workers
        const unregisterPromises = registrations.map((reg) => reg.unregister());
        Promise.all(unregisterPromises).finally(() => {
          forceRedirect();
        });
      })
      .catch(() => forceRedirect());
  } else {
    forceRedirect();
  }
} else {
  registerSW({ immediate: true });
}

const router = (
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/quota-exceeded" element={<QuotaExceeded />} />
        <Route path="forget-password" element={<ForgetPass />} />
        <Route path="reset-pass" element={<ResetPass />} />
        <Route path="about" element={<About />} />
        <Route element={<ProtectedRoute />}>
          <Route path="onboarding" element={<OnboardingWizard />} />
          <Route
            path="onboarding/teacher"
            element={<TeacherOnboardingWizard />}
          />
          <Route path="batch-enroll" element={<BatchEnrollmentStatus />} />
          <Route path="arena" element={<GameArena />} />
          <Route path="browse-batches" element={<BrowseBatches />} />
          <Route
            path="student-attendance"
            element={<StudentAttendancePage />}
          />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<ProfileForm />} />
          <Route path="create-question" element={<CreateQuestion />} />
          <Route path="manage-questions" element={<ManageQuestions />} />
          <Route path="edit/:quesId" element={<EditQuestion />} />
          <Route path="mock-exam" element={<CreateMockTestPage />} />
          <Route path="all-mock-tests" element={<AllMockTests />} />
          <Route path="start-mock-test/:paperId" element={<StartMockTest />} />
          <Route path="exam-summary/:paperId" element={<ExamSummary />} />
          <Route path="show-mock-test/:paperId" element={<ShowMockTest />} />
          <Route path="attain-test" element={<AttainTest />} />
          <Route
            path="mock-test-result/:paperId"
            element={<MockTestResults />}
          />
          <Route path="manage-batch" element={<ProtectedTeacherRoutes />}>
            <Route path="create" element={<CreateBatch />} />
            <Route path="students" element={<AddStudents />} />
            <Route path="view" element={<ViewBatch />} />
            <Route path="view/:userId" element={<ProfileView />} />
            <Route path="edit" element={<EditBatch />} />
            <Route path="edit/:batchId" element={<EditBatch />} />
          </Route>
          {/* Batch-required routes — students blocked if not enrolled */}
          <Route element={<ProtectedStudentBatchRoute />}>
            <Route
              path="student-attendance"
              element={<StudentAttendancePage />}
            />
            <Route path="daily-diary" element={<DailyDiary />} />
            <Route path="assessment">
              <Route path="" element={<Assessment />} />
            </Route>
            <Route path="attendance">
              <Route path="register" element={<AttendanceRegister />} />
              <Route path="mark-my-attendance" element={<AttendanceTracker />} />
              <Route path="marktoday" element={<Navigate to="/attendance/mark-my-attendance" replace />} />
              <Route
                path="college-attendance"
                element={<CollegeAttendance />}
              />
            </Route>
          </Route>
          <Route element={<ProtectedAdminRoutes />}>
            <Route path="add-modules" element={<Modules />} />
            <Route path="add-bulk-questions" element={<AddBulkQuestions />} />
            <Route path="migration-dashboard" element={<MigrationDashboard />} />
            <Route path="manage-trades" element={<ManageTrades />} />
            <Route path="manage-colleges" element={<ManageColleges />} />
            <Route path="test-notifications" element={<NotificationTester />} />
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  </Router>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <Provider store={store}>{router}</Provider>,
  // </React.StrictMode>
);
