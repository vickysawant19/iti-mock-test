import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";

import { addUser } from "../../store/userSlice";
import students from "../../assets/students.jpeg";
import authService from "../../appwrite/auth";
import userProfileService from "../../appwrite/userProfileService";
import { addProfile } from "../../store/profileSlice";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user);
  const profile = useSelector((state) => state.profile);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.$id) {
      navigate("/dash");
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Mock API call
      const user = await authService.login(data);
      dispatch(addUser(user));
      const res = await userProfileService.getUserProfile(user.$id);
      if (res) {
        dispatch(addProfile(res));
        toast.success("Login successful!");
        navigate("/dash");
      } else {
        navigate("/profile");
      }
    } catch (error) {
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 flex justify-center items-center h-screen">
      <div className="w-1/2 h-screen hidden lg:block">
        <img
          src={students}
          alt="Students"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="lg:p-20 md:p-24 sm:20 p-8 w-full lg:w-1/2">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600">
              Email
            </label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              id="email"
              name="email"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              autoComplete="off"
            />
            {errors.email && (
              <span className="text-red-500 text-sm">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="mb-4 relative">
            <label htmlFor="password" className="block text-gray-600">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              autoComplete="off"
              {...register("password", {
                required: "Password is required",
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </button>
            {errors.password && (
              <span className="text-red-500 text-sm">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="remember"
              name="remember"
              className="text-blue-500"
            />
            <label htmlFor="remember" className="text-gray-600 ml-2">
              Remember Me
            </label>
          </div>

          <div className="mb-6 text-blue-500">
            <Link to={"/forget-password"} className="hover:underline">
              Forget password?
            </Link>
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            {isLoading ? <ClipLoader size={20} color="white" /> : "Login"}
          </button>
        </form>

        <div className="mt-6 text-blue-500 text-center">
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
