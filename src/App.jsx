import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { addUser } from "./store/userSlice";
import authService from "./appwrite/auth";
import { ClipLoader } from "react-spinners";
import { Analytics } from "@vercel/analytics/react";
import userProfileService from "./appwrite/userProfileService";
import { addProfile } from "./store/profileSlice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const user = useSelector((state) => state.user);
  const profile = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
              navigate("/dash");
            }
          }
        } else {
          if (!profile) {
            navigate("/profile");
          }
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        navigate("/login");
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
      <Navbar />
      {/* <Analytics /> */}
      <div className="pt-10 bg-gray-100 w-full max-w-screen-lg mx-auto">
        <Outlet />
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
