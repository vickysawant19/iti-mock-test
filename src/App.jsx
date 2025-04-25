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
import ScrollToTop from "./utils/ScrollToTop.jsx";
import { ThemeProvider } from "./ThemeProvider";

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
          
          if (!profile) {
            const profileRes = await userProfileService.getUserProfile(currentUser.$id);
            
            if (profileRes) {
              dispatch(addProfile(profileRes));
              
              if (window.location.pathname === "/") {
                navigate("/home");
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
      }
    };
    
    checkUserStatus();
  }, [navigate, dispatch, profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <ScrollToTop />
      <div className="bg-gray-100 w-full min-h-screen">
        <Navbar isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />
        
        <div className="bg-gray-100 w-full mx-auto">
          <Outlet />
          <ToastContainer />
        </div>
        
        <Analytics />
      </div>
    </ThemeProvider>
  );
}

export default App;