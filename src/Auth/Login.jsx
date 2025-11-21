import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";

import { addUser, selectUser } from "@/store/userSlice"
import students from "@/assets/students.jpeg";
import authService from "@/appwrite/auth";
import userProfileService from "@/appwrite/userProfileService";
import { addProfile, selectProfile } from "@/store/profileSlice";


const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Default redirect is /dash if no previous location is set
  const from = location.state?.from || "/dash";

  useEffect(() => {
    if (user && user.$id) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]); // only navigate when user changes
  

  const onSubmit = async (data) => {
  setIsLoading(true);
  try {
    // Login and get user
    const user = await authService.login(data);
    dispatch(addUser(user));

    // Fetch user profile
    const res = await userProfileService.getUserProfile(user?.$id);
    if (res) {
      dispatch(addProfile(res));
      toast.success("Login successful!");
      navigate("/", { replace: true }); // Redirect to root after successful login
    } else {
      toast.info("Please complete your profile.");
      navigate("/profile"); // Redirect to profile page if profile is missing
    }
  } catch (error) {
    console.error("Login Error:", error);
    toast.error(`Login failed: ${error?.message || "Unknown error"}`);
  } finally {
    setIsLoading(false);
  }
};

  

  return (
    <div className="bg-gray-100 dark:bg-gray-900 flex justify-center items-center h-screen">
      {/* Left Section - Image */}
      <div className="w-1/2 h-screen hidden lg:block">
        <img
          src={students}
          alt="Students"
          className="object-cover w-full h-full dark:hidden"
        />
        <img
          src={students} // Replace with a darker-themed image for dark mode
          alt="Students (Dark Mode)"
          className="object-cover w-full h-full hidden dark:block"
        />
      </div>

      {/* Right Section - Login Form */}
      <div className="lg:p-20 md:p-24 sm:p-20 p-8 w-full lg:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-md m-10">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Login
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email Field */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-600 dark:text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              id="email"
              name="email"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100"
              autoComplete="off"
            />
            {errors.email && (
              <span className="text-red-500 dark:text-red-400 text-sm">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4 relative">
            <label
              htmlFor="password"
              className="block text-gray-600 dark:text-gray-300"
            >
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100"
              autoComplete="off"
              {...register("password", {
                required: "Password is required",
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-600 dark:text-gray-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </button>
            {errors.password && (
              <span className="text-red-500 dark:text-red-400 text-sm">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="remember"
              name="remember"
              className="text-blue-500 dark:text-blue-400"
            />
            <label
              htmlFor="remember"
              className="text-gray-600 dark:text-gray-300 ml-2"
            >
              Remember Me
            </label>
          </div>

          {/* Forgot Password Link */}
          <div className="mb-6 text-blue-500 dark:text-blue-400">
            <Link to={"/forget-password"} className="hover:underline">
              Forget password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            disabled={isLoading}
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            {isLoading ? <ClipLoader size={20} color="white" /> : "Login"}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-blue-500 dark:text-blue-400 text-center">
          Need an account?
          <Link to={"/signup"} className="hover:underline">
            <span className="ml-2">SignUp Here</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
