import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";

import { addUser } from "./store/userSlice";
import { addProfile } from "./store/profileSlice";
import authService from "./appwrite/auth";
import userProfileService from "./appwrite/userProfileService";
import Navbar from "./components/private/components/Navbar";
import { Analytics } from "@vercel/analytics/react";

import { ThemeProvider } from "./ThemeProvider";
import Loader from "./components/components/Loader";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const profile = useSelector((state) => state.profile);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const currentUser = await authService.getCurrentUser();

        if (currentUser) {
          dispatch(addUser(currentUser));

          // Fetch user profile if it doesn't exist in the Redux store
          if (!profile) {
            const profileRes = await userProfileService.getUserProfile(
              currentUser.$id
            );

            if (profileRes) {
              dispatch(addProfile(profileRes));

              // Redirect to home if the user is on the root path
              if (window.location.pathname === "/") {
                navigate("/home");
              }
            } else {
              // Redirect to profile setup if no profile exists
              navigate("/profile");
            }
          }
        }
      } catch (error) {
        console.error("Error checking user status: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [navigate, dispatch, profile]);

  if (isLoading) {
    return (
      <Loader isLoading={isLoading } />
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <div className="bg-gray-100 w-full min-h-screen dark:bg-black">
        {/* Navbar */}
        <Navbar isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />

        {/* Main Content */}
        <div className="mx-auto">
          <Outlet />
          <ToastContainer />
        </div>

        {/* Analytics */}
        <Analytics />
      </div>
    </ThemeProvider>
  );
}

export default App;
