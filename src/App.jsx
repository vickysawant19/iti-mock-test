import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { addUser } from "./store/userSlice";
import authService from "./appwrite/auth";
import { ClipLoader } from "react-spinners";
import { Analytics } from "@vercel/analytics/react";
import userProfileService from "./appwrite/userProfileService";
import { addProfile } from "./store/profileSlice";

function App() {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        if (!user) {
          const res = await authService.getCurrentUser();
          if (res) {
            dispatch(addUser(res));
            const profile = await userProfileService.getUserProfile(res.$id);
            if (profile) {
              dispatch(addProfile(profile));
              if (window.location.pathname === "/") {
                navigate("/dash");
              }
            } else {
              navigate("/profile");
            }
          }
        }
      } catch (error) {
        // console.log(error.message);     // log
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [dispatch]);

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
      <Analytics />
      <div className="pt-10 bg-gray-100 w-full max-w-screen-lg mx-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
