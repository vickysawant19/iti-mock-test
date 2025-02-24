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
import ScrollToTop from "./utils/ScrollToTop.Jsx";

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
        if (!user) {
          const res = await authService.getCurrentUser();
          if (res) {
            dispatch(addUser(res));
            const profileRes = await userProfileService.getUserProfile(res.$id);
            if (!profileRes) {
              navigate("/profile");
            }
            dispatch(addProfile(profileRes));
            if (window.location.pathname === "/") {
              navigate("/home");
            }
          }
        } else {
          if (!profile) {
            navigate("/profile");
          }
        }
      } catch (error) {
        console.error("Error checking user status: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserStatus();
  }, [navigate, dispatch]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
        </div>
      </>
    );
  }

  return (
    <div className="bg-gray-100 w-full min-h-screen ">
      <Navbar isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />

      <Analytics />
      <div className="md:ml-72">
        <div className={`pt-10 bg-gray-100 w-full mx-auto`}>
          <ScrollToTop />
          <Outlet />
          <ToastContainer />
        </div>
      </div>
    </div>
  );
}

export default App;
