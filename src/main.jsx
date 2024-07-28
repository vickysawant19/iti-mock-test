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
import EditProfileForm from "./components/private/ProfileEdit.jsx";
import MockTestResults from "./components/private/MockTestResults.jsx";
import Home from "./components/private/pages/Home.jsx";
import About from "./components/private/pages/About.jsx";
import Profile from "./components/private/pages/Profile.jsx";
import ForgetPass from "./components/Auth/ForgetPass.jsx";

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
          <Route path="profile/edit" element={<EditProfileForm />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/dash" />} />
      </Route>
    </Routes>
  </Router>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>{router}</Provider>
  </React.StrictMode>
);
