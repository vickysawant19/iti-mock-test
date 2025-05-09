import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";

import authService from "../../appwrite/auth";
import { addUser, selectUser } from "../../store/userSlice";
import students from "../../assets/students.jpeg";
import { ClipLoader } from "react-spinners";

const Signup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      console.log("naviagte to dash")
      navigate("/dash");
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const user = await authService.createAccount(data);
      if (user) {
        dispatch(addUser(user));
        toast.success("Signup successful!");
        navigate("/profile");
      }
    } catch (error) {
      toast.error(`Signup failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const password = watch("password", "");

  return (
    <div className="bg-gray-100 dark:bg-gray-900 flex justify-center items-center min-h-screen">
      {/* Left Section - Image */}
      <div className="w-1/2 h-screen hidden lg:block">
        <img
          src={students}
          alt="Placeholder Image"
          className="object-cover w-full h-full dark:hidden"
        />
        <img
          src={students} // Replace with a darker-themed image for dark mode
          alt="Placeholder Image (Dark Mode)"
          className="object-cover w-full h-full hidden dark:block"
        />
      </div>

      {/* Right Section - Signup Form */}
      <div className="lg:p-20 md:p-24 sm:p-20 p-8 w-full lg:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md mx-10 ">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          SignUp
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} method="POST">
          {/* Name Field */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-600 dark:text-gray-300"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100"
              autoComplete="off"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

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
              id="email"
              name="email"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100"
              autoComplete="off"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.email.message}
              </p>
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
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long",
                },
                pattern: {
                  value: /^[A-Za-z0-9]+$/,
                  message: "Password must be alphanumeric",
                },
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
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4 relative">
            <label
              htmlFor="cpassword"
              className="block text-gray-600 dark:text-gray-300"
            >
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="cpassword"
              name="cpassword"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100"
              autoComplete="off"
              {...register("cpassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-600 dark:text-gray-400"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </button>
            {errors.cpassword && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.cpassword.message}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="mb-6 text-blue-500 dark:text-blue-400">
            <a href="#" className="hover:underline">
              Forgot Password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            disabled={isLoading}
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            {isLoading ? <ClipLoader size={20} color="white" /> : "Sign Up"}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-blue-500 dark:text-blue-400 text-center">
          Already have an account?
          <Link to={"/Login"} className="hover:underline">
            <span className="ml-2">Login Here</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
