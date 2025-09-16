import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useForm, Controller } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";

import authService from "../../appwrite/auth";
import { addUser, selectUser } from "../../store/userSlice";
import students from "../../assets/students.jpeg";
import { ClipLoader } from "react-spinners";
import LoadingState from "../private/teacher/batch/components/LoadingState";

// Shadcn/ui Toggle Component


const Signup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [labels, setLabels] = useState(["student"]); // Default to student

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setValue,
  } = useForm({
    defaultValues: {
      labels: ["Student"],
      countryCode: "+91"
    }
  });

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("here",user)
    if (user) {
      console.log("navigate to dash");
      navigate("/dash");
    }
  }, [navigate,user]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await authService.createAccount(data);
      if(!result.success){
        throw Error(result.error)
      }
      if (result.success) {
        toast.success("Signup successful! Please login!");
        navigate("/login");
      }
    } catch (error) {
      toast.error(`Signup failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const password = watch("password", "");

  const handleUserTypeChange = (type) => {
    setLabels([type]);
    setValue("labels", [type]);
  };

  
  if(!isLoading) {
    return <LoadingState />
  }

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
      <div className="lg:p-20 md:p-24 sm:p-20 p-8 w-full lg:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md mx-10">
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

          {/* Phone Number Field */}
          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-gray-600 dark:text-gray-300"
            >
              Phone Number
            </label>
            <div className="flex">
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-l-md py-2 px-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-600"
                {...register("countryCode", { required: "Country code is required" })}
              >
                <option value="+91">+91 (India)</option>
                <option value="+1">+1 (USA/Canada)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+61">+61 (Australia)</option>
                <option value="+49">+49 (Germany)</option>
                <option value="+33">+33 (France)</option>
                <option value="+86">+86 (China)</option>
                <option value="+81">+81 (Japan)</option>
                <option value="+82">+82 (South Korea)</option>
                <option value="+65">+65 (Singapore)</option>
              </select>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter phone number"
                className="flex-1 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md py-2 px-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100"
                autoComplete="off"
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{6,15}$/,
                    message: "Please enter a valid phone number (6-15 digits)",
                  },
                })}
              />
            </div>
            {(errors.phone || errors.countryCode) && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.phone?.message || errors.countryCode?.message}
              </p>
            )}
          </div>

          {/* User Type Toggle Field */}
          <div className="mb-4">
            <label className="block text-gray-600 dark:text-gray-300 mb-3">
              User Type
            </label>
            <Controller
              name="labels"
              control={control}
              rules={{ required: "User type is required" }}
              render={({ field }) => (
                <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <label className="flex-1">
                    <input
                      type="radio"
                      value="Student"
                      checked={labels.includes("Student")}
                      onChange={() => handleUserTypeChange("Student")}
                      className="sr-only"
                    />
                    <div
                      className={`h-10 flex items-center justify-center text-sm font-medium rounded-md cursor-pointer transition-all duration-200 ${
                        labels.includes("Student")
                          ? "bg-blue-500 text-white shadow-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      Student
                    </div>
                  </label>
                  <label className="flex-1">
                    <input
                      type="radio"
                      value="Teacher"
                      checked={labels.includes("Teacher")}
                      onChange={() => handleUserTypeChange("Teacher")}
                      className="sr-only"
                    />
                    <div
                      className={`h-10 flex items-center justify-center text-sm font-medium rounded-md cursor-pointer transition-all duration-200 ${
                        labels.includes("Teacher")
                          ? "bg-blue-500 text-white shadow-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      Instructor
                    </div>
                  </label>
                </div>
              )}
            />
            {errors.labels && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.labels.message}
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