import React from "react";
import ReactDOM from "react-dom/client";
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

import Login from "./components/Auth/Login.jsx";
import Signup from "./components/Auth/Signup.jsx";

import ProtectedRoute from "./components/private/ProtectedRoute.jsx";

import CreateQuestion from "./components/private/mocktest/CreateQuestion.jsx";
import ManageQuestions from "./components/private/mocktest/ManageQuestions.jsx";
import EditQuestion from "./components/private/mocktest/EditQuestion.jsx";
import CreateMockTest from "./components/private/mocktest/CreateMockTest.jsx";
import AllMockTests from "./components/private/mocktest/AllMockTests.jsx";
import StartMockTest from "./components/private/mocktest/StartMockTest.jsx";
import ShowMockTest from "./components/private/mocktest/ShowMockTest.jsx";
import AttainTest from "./components/private/mocktest/AttainTest.jsx";
import MockTestResults from "./components/private/mocktest/MockTestResults.jsx";

import Dash from "./components/private/pages/Dash.jsx";

import Home from "./components/private/pages/Home.jsx";
import About from "./components/private/pages/About.jsx";
import ForgetPass from "./components/Auth/ForgetPass.jsx";

import CheckAttendance from "./components/private/teacher/attaindance/CheckAttendance.jsx";
import MarkStudentAttendance from "./components/private/teacher/attaindance/MarkStudentAttendance.jsx";

import CreateBatch from "./components/private/teacher/batch/CreateBatch.jsx";
import ViewBatch from "./components/private/teacher/batch/ViewBatch.jsx";

import Profile from "./components/private/profile/Profile.jsx";
import ProfileView from "./components/private/profile/ProfileView.jsx";
import ProfileForm from "./components/private/profile/ProfileForm.jsx";
import ResetPass from "./components/Auth/ResetPass.jsx";
import ChangePassword from "./components/Auth/changePassword.jsx";
import ProtectedTeacherRoutes from "./components/private/ProtectedTeacherRoutes.jsx";

import MarkHolidays from "./components/private/teacher/attaindance/MarkHolidays.jsx";
import ProtectedAdminRoutes from "./components/private/ProtectedAdminRoutes.jsx";

import Modules from "./components/private/admin/Modules.jsx";

import Assessment from "./components/private/assessment/Assessment.jsx";
import DailyDiary from "./components/private/teacher/batch/daily-dairy/DailyDiary.jsx";
import AddStudents from "./components/private/teacher/batch/students/AddStudents.jsx";
import FaceAttendance from "./components/private/teacher/attaindance/faceAttendance/FaceAttendance.jsx";
import MarkAttendance from "./components/private/teacher/attaindance/MarkAttendance.jsx";

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
        <Route index path="home" element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forget-password" element={<ForgetPass />} />
        <Route path="reset-pass" element={<ResetPass />} />

        <Route path="about" element={<About />} />
        <Route path="profile" element={<Profile />} />

        <Route element={<ProtectedRoute />}>
          <Route path="dash" element={<Dash />} />
          <Route path="change-password" element={<ChangePassword />} />
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
            <Route path="mark-holidays" element={<MarkHolidays />} />
            <Route path="mark-attendance" element={<MarkAttendance />} />
          </Route>
          <Route path="attendance">
            <Route path="face" element={<FaceAttendance />} />
            <Route path="mark-holidays" element={<MarkHolidays />} />
            <Route path="mark-attendance" element={<MarkAttendance />} />
            <Route
              path="mark-student-attendance"
              element={<MarkStudentAttendance />}
            />
            <Route path="check-attendance" element={<CheckAttendance />} />
          </Route>
          <Route path="" element={<ProtectedAdminRoutes />}>
            <Route path="add-modules" element={<Modules />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <div className="w-full h-screen mt-20  flex justify-center ">
              404 : Page Not Found
            </div>
          }
        />
        {/* <Route path="*" element={<Navigate to="/dash" />} /> */}
      </Route>
    </Routes>
  </Router>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <Provider store={store}>{router}</Provider>
  // </React.StrictMode>
);
