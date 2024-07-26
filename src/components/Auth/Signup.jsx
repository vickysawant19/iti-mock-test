import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import authService from "../../appwrite/auth";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../../store/userSlice";
import students from "../../assets/students.jpeg";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate("/dash");
    }
  }, [user]);

  const onSubmit = async (data) => {
    try {
      const user = await authService.createAccount(data);
      if (user) {
        dispatch(addUser(user));
        toast.success("Signup successful!");
        navigate("/profile");
      }
    } catch (error) {
      toast.error(`Signup failed: ${error.message}`);
    }
  };

  const password = watch("password", "");

  return (
    <div className="bg-gray-100 flex justify-center items-center min-h-screen">
      <div className="w-1/2 h-screen hidden lg:block">
        <img
          src={students}
          alt="Placeholder Image"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="lg:p-20 md:p-24 sm:20 p-8 w-full lg:w-2/3">
        <h1 className="text-2xl font-semibold mb-4">SignUp</h1>
        <form onSubmit={handleSubmit(onSubmit)} method="POST">
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-600">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              autoComplete="off"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              autoComplete="off"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
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
              className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="mb-4 relative">
            <label htmlFor="cpassword" className="block text-gray-600">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="cpassword"
              name="cpassword"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              autoComplete="off"
              {...register("cpassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </button>
            {errors.cpassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.cpassword.message}
              </p>
            )}
          </div>

          <div className="mb-6 text-blue-500">
            <a href="#" className="hover:underline">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-blue-500 text-center">
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
