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
import { store } from "./store/store.js";

import Login from "./components/Auth/Login.jsx";
import Signup from "./components/Auth/Signup.jsx";

import ProtectedRoute from "./components/private/ProtectedRoute.jsx";

import CreateQuestion from "./components/private/pages/CreateQuestion.jsx";
import ManageQuestions from "./components/private/pages/ManageQuestions.jsx";
import EditQuestion from "./components/private/EditQuestion.jsx";
import CreateMockTest from "./components/private/pages/CreateMockTest.jsx";
import AllMockTests from "./components/private/pages/AllMockTests.jsx";

import StartMockTest from "./components/private/StartMockTest.jsx";
import ShowMockTest from "./components/private/ShowMockTest.jsx";
import AttainTest from "./components/private/pages/AttainTest.jsx";
import Dash from "./components/private/pages/Dash.jsx";

import MockTestResults from "./components/private/MockTestResults.jsx";
import Home from "./components/private/pages/Home.jsx";
import About from "./components/private/pages/About.jsx";
import Profile from "./components/private/pages/Profile.jsx";
import ForgetPass from "./components/Auth/ForgetPass.jsx";
import ProfileForm from "./components/private/ProfileForm.jsx";
import CreateBatch from "./components/private/teacher/CreateBatch.jsx";

import ViewBatch from "./components/private/teacher/ViewBatch.jsx";
import ProfileView from "./components/private/ProfileView.jsx";
import MarkAttaindance from "./components/private/teacher/attaindance/MarkAttaindance.jsx";
import CheckAttendance from "./components/private/teacher/attaindance/CheckAttendance.jsx";
import MarkStudentAttendance from "./components/private/teacher/attaindance/MarkStudentAttendance.jsx";

const router = (
  <Router>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Navigate to="/login" />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forget-password" element={<ForgetPass />} />
        <Route path="about" element={<About />} />
        <Route path="profile" element={<Profile />} />

        <Route element={<ProtectedRoute />}>
          <Route path="home" element={<Home />} />
          <Route path="dash" element={<Dash />} />
          <Route path="profile/edit" element={<ProfileForm />} />
          <Route path="create-question" element={<CreateQuestion />} />
          <Route path="manage-questions" element={<ManageQuestions />} />
          <Route path="edit/:quesId" element={<EditQuestion />} />
          <Route path="mock-exam" element={<CreateMockTest />} />
          <Route path="all-mock-tests" element={<AllMockTests />} />
          <Route path="start-mock-test/:paperId" element={<StartMockTest />} />
          <Route path="show-mock-test/:paperId" element={<ShowMockTest />} />
          <Route path="attain-test" element={<AttainTest />} />
          <Route
            path="mock-test-result/:paperId"
            element={<MockTestResults />}
          />
          <Route path="manage-batch">
            <Route path="create" element={<CreateBatch />} />
            <Route path="view" element={<ViewBatch />} />
            <Route path="view/:userId" element={<ProfileView />} />
            <Route path="edit/:userId" element={<ProfileForm />} />
            <Route path="edit/:batchId" element={<div>Edit</div>} />
            <Route path="delete/:batchId" element={<div>Delete</div>} />
          </Route>
          <Route path="attaindance">
            <Route path="mark-attendance" element={<MarkAttaindance />} />
            <Route path="mark-student-attendance" element={<MarkStudentAttendance />} />
            <Route path="check-attendance" element={<CheckAttendance />} />
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
  <React.StrictMode>
    <Provider store={store}>{router}</Provider>
  </React.StrictMode>
);
