import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { addUser } from "./store/userSlice";
import authService from "./appwrite/auth";
import { ClipLoader } from "react-spinners";

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
            if (window.location.pathname === "/") {
              navigate("/home");
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
      <div className="pt-10 bg-gray-100 w-full max-w-screen-lg mx-auto">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default App;
