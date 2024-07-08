import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import {
  Route,
  Router,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Login from "./components/Auth/Login.jsx";
import Signup from "./components/Auth/Signup.jsx";
import About from "./components/About.jsx";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import ProtectedRoute from "./components/private/ProtectedRoute.jsx";
import Home from "./components/private/Home.jsx";
import CreateQuestion from "./components/private/CreateQuestion.jsx";
import ManageQuestions from "./components/private/ManageQuestions.jsx";
import EditQuestion from "./components/private/EditQuestion.jsx";

import CreateMockTest from "./components/private/CreateMockTest.jsx";
import AllMockTests from "./components/private/AllMockTests.jsx";
import Profile from "./components/private/Profile.jsx";
import StartMockTest from "./components/private/StartMockTest.jsx";
import ShowMockTest from "./components/private/ShowMockTest.jsx";
import AttainTest from "./components/private/AttainTest.jsx";

import Dash from "./components/private/Dash.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="" element={<App />}>
        <Route index path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />
        <Route element={<ProtectedRoute />}>
          <Route index path="home" element={<Home />} />
          <Route path="dash" element={<Dash />} />
          <Route path="create-question" element={<CreateQuestion />} />
          <Route path="manage-questions" element={<ManageQuestions />} />
          <Route path="edit/:quesId" element={<EditQuestion />} />
          <Route path="mock-exam" element={<CreateMockTest />} />
          <Route path="profile" element={<Profile />} />
          <Route path="all-mock-tests" element={<AllMockTests />} />
          <Route path="start-mock-test/:paperId" element={<StartMockTest />} />
          <Route path="show-mock-test/:paperId" element={<ShowMockTest />} />
          <Route path="attain-test" element={<AttainTest />} />
        </Route>
      </Route>
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
