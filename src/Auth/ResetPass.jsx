import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import authService from "@/appwrite/auth";

const ResetPass = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    try {
      await authService.resetPassword(userId, secret, password);
      toast.success("Password has been reset successfully");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-sm shadow-md dark:shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          Reset Password
        </h2>
        <form onSubmit={handleSubmit}>
          {/* New Password Field */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              New Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-sm shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              Confirm Password:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-sm shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Submit Button */}
          <button
            disabled={isLoading}
            type="submit"
            className="w-full px-4 py-2 font-bold text-white bg-blue-500 dark:bg-blue-600 rounded-sm hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            {isLoading ? (
              <ClipLoader size={20} color={"#ffffff"} />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        {/* Error Message */}
        {message && (
          <p className="mt-4 text-center text-red-500 dark:text-red-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPass;
