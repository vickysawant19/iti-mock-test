import React from "react";
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

import Login from "./Auth/Login.jsx";
import Signup from "./Auth/Signup.jsx";

import ProtectedRoute from "./private/ProtectedRoute.jsx";

import CreateQuestion from "./private/mocktest/CreateQuestion.jsx";
import ManageQuestions from "./private/mocktest/ManageQuestions.jsx";
import EditQuestion from "./private/mocktest/EditQuestion.jsx";
import CreateMockTest from "./private/mocktest/CreateMockTest.jsx";
import AllMockTests from "./private/mocktest/AllMockTests.jsx";
import StartMockTest from "./private/mocktest/StartMockTest.jsx";
import ShowMockTest from "./private/mocktest/ShowMockTest.jsx";
import AttainTest from "./private/mocktest/AttainTest.jsx";
import MockTestResults from "./private/mocktest/MockTestResults.jsx";

import Dash from "./pages/Dash.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import ForgetPass from "./Auth/ForgetPass.jsx";
import MarkStudentAttendance from "./private/Attendance/MarkStudentAttendance.jsx";
import CreateBatch from "./private/teacher/batch/CreateBatch.jsx";
import ViewBatch from "./private/teacher/batch/ViewBatch.jsx";
import Profile from "./private/profile/Profile.jsx";
import ProfileView from "./private/profile/ProfileView.jsx";
import ProfileForm from "./private/profile/ProfileForm.jsx";
import ResetPass from "./Auth/ResetPass.jsx";
import ChangePassword from "./Auth/changePassword.jsx";
import ProtectedTeacherRoutes from "./private/ProtectedTeacherRoutes.jsx";

import ProtectedAdminRoutes from "./private/ProtectedAdminRoutes.jsx";
import Modules from "./private/admin/Modules.jsx";
import Assessment from "./private/assessment/Assessment.jsx";
import DailyDiary from "./private/teacher/batch/daily-dairy/DailyDiary.jsx";
import AddStudents from "./private/teacher/batch/students/AddStudents.jsx";

import PageNotFound from "./PageNotFound.jsx";
import AddBulkQuestions from "./private/admin/BulkOperations/AddBulkQuestions.jsx";
import AttendanceRegister from "./private/Attendance/AttendanceRegister/AttendanceRegister.jsx";
import AttendanceTracker from "./private/Attendance/todaysAttendance.jsx";
import CollegeAttendance from "./private/collegeDashboard/CollegeAttendance.jsx";

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New content available. Reload to update?")) {
      updateSW(true);
    }
  },
});

const router = (
  <Router>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forget-password" element={<ForgetPass />} />
        <Route path="reset-pass" element={<ResetPass />} />
        <Route path="about" element={<About />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dash" element={<Dash />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<ProfileForm />} />
          <Route path="create-question" element={<CreateQuestion />} />
          <Route path="manage-questions" element={<ManageQuestions />} />
          <Route path="edit/:quesId" element={<EditQuestion />} />
          <Route path="mock-exam" element={<CreateMockTest />} />
          <Route path="all-mock-tests" element={<AllMockTests />} />
          <Route path="start-mock-test/:paperId" element={<StartMockTest />} />
          <Route path="show-mock-test/:paperId" element={<ShowMockTest />} />
          <Route path="attain-test" element={<AttainTest />} />
          <Route path="daily-dairy" element={<DailyDiary />} />
          <Route
            path="mock-test-result/:paperId"
            element={<MockTestResults />}
          />
          <Route path="manage-batch" element={<ProtectedTeacherRoutes />}>
            <Route path="create" element={<CreateBatch />} />
            <Route path="students" element={<AddStudents />} />
            <Route path="view" element={<ViewBatch />} />
            <Route path="view/:userId" element={<ProfileView />} />
            <Route path="edit/:userId" element={<ProfileForm />} />
            <Route path="edit/:batchId" element={<div>Edit</div>} />
            <Route path="delete/:batchId" element={<div>Delete</div>} />
          </Route>
          <Route path="assessment">
            <Route path="" element={<Assessment />} />
          </Route>
          <Route path="attendance">
            <Route path="register" element={<AttendanceRegister />} />
            <Route path="marktoday" element={<AttendanceTracker />} />
            <Route
              path="mark-student-attendance"
              element={<MarkStudentAttendance />}
            />
            <Route path="college-attendance" element={<CollegeAttendance />} />
          </Route>
          <Route element={<ProtectedAdminRoutes />}>
            <Route path="add-modules" element={<Modules />} />
            <Route path="add-bulk-questions" element={<AddBulkQuestions />} />

          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  </Router>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <Provider store={store}>{router}</Provider>
  // </React.StrictMode>
);
