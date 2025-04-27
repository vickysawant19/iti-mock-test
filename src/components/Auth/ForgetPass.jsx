import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

import authService from "../../appwrite/auth";

const ForgetPass = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await authService.forgotPassword(email);
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      {/* Back Arrow */}
      <div
        className="absolute top-20 left-5 text-3xl text-gray-700 dark:text-gray-300 cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft />
      </div>

      {/* Forgot Password Form */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-sm shadow-md dark:shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          Forgot Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="flex flex-col">
            <label
              htmlFor="email"
              className="mb-1 font-medium text-gray-600 dark:text-gray-300"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              className="px-4 py-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-500 dark:bg-blue-600 rounded-sm hover:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            Reset Password
          </button>
        </form>

        {/* Success Message */}
        {message && (
          <p className="mt-4 text-green-500 dark:text-green-400">{message}</p>
        )}

        {/* Error Message */}
        {error && (
          <p className="mt-4 text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
};

export default ForgetPass;
