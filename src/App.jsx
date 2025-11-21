import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";

import { addUser, selectUser } from "./store/userSlice";
import { addProfile, selectProfile } from "./store/profileSlice";
import authService from "./appwrite/auth";
import userProfileService from "./appwrite/userProfileService";
import Navbar from "./components/navbar/Navbar";
import { Analytics } from "@vercel/analytics/react";

import { ThemeProvider } from "./ThemeProvider";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector(selectProfile);

  const checkUserStatus = async () => {
    dispatch(addUser({ isLoading: true }));
    dispatch(addProfile({ isLoading: true }));
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        dispatch(addUser({ data: currentUser, isLoading: false }));
        if (!profile) {
          const profileRes = await userProfileService.getUserProfile(
            currentUser.$id
          );
          if (profileRes) {
            dispatch(addProfile({ data: profileRes, isLoading: false }));
            if (window.location.pathname === "/") {
              navigate("/");
            }
          } else {
            navigate("/profile");
          }
        }
      }
    } catch (error) {
      console.error("Error checking user status: ", error);
    } finally {
      setIsLoading(false);
      dispatch(addUser({ isLoading: false }));
      dispatch(addProfile({ isLoading: false }));
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, [navigate, dispatch, profile]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <div className="bg-gray-100 w-full min-h-screen dark:bg-black">
        <Navbar
          isNavOpen={isNavOpen}
          setIsNavOpen={setIsNavOpen}
          isLoading={!isLoading}
        />

        <div className="mx-auto">
          <Outlet />
          <ToastContainer />
        </div>

        <Analytics />
      </div>
    </ThemeProvider>
  );
}

export default App;
