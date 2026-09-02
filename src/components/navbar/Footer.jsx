import React from "react";
import { APP_VERSION, BUILD_DATE } from "@/config/version";

const Footer = () => {
  return (
    <footer className="bg-gray-600 text-white pb-9 dark:bg-gray-800 dark:text-gray-200">
      <div className="container px-2 py-8 mx-auto flex justify-center">
        <div className="grid grid-cols-1 gap-6 gap-y-5 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-6">
          {/* Newsletter Section */}
          <div className="sm:col-span-3">
            <h1 className="text-xl font-bold text-gray-200 md:text-center xl:text-2xl dark:text-gray-100">
              Subscribe to Our Newsletter
            </h1>
            <div className="flex flex-col items-center mt-6 space-y-3 md:flex-row md:space-y-0 justify-center">
              <input
                type="text"
                className="px-4 py-2 text-gray-700 bg-white border rounded-md focus:border-blue-400 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-opacity-40 focus:ring-blue-300 dark:focus:ring-blue-500"
                placeholder="Your Email Address"
              />
              <button className="w-full px-6 py-2.5 text-sm font-medium tracking-wider text-white transition-colors duration-300 transform md:w-auto md:mx-4 focus:outline-none bg-gray-800 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 focus:ring-3 focus:ring-gray-300 dark:focus:ring-gray-500 focus:ring-opacity-80">
                Subscribe
              </button>
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <p className="font-semibold text-gray-200 dark:text-gray-300">
              Quick Links
            </p>
            <div className="flex flex-col items-start mt-5 space-y-2">
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Home
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                About Us
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Contact Us
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Services
              </a>
            </div>
          </div>

          {/* Resources Section */}
          <div>
            <p className="font-semibold text-gray-200 dark:text-gray-300">
              Resources
            </p>
            <div className="flex flex-col items-start mt-5 space-y-2">
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Mock Tests
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Practice Questions
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Study Tips
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Exam Strategies
              </a>
            </div>
          </div>

          {/* Legal Section */}
          <div>
            <p className="font-semibold text-gray-200 dark:text-gray-300">
              Legal
            </p>
            <div className="flex flex-col items-start mt-5 space-y-2">
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Terms & Conditions
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
              >
                Cookies Policy
              </a>
            </div>
          </div>
        </div>
      </div>
      <hr className="mt-5 mx-5 border-gray-500 dark:border-gray-700" />
      <div className="m-5 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto px-4">
        <p className="text-center text-gray-200 dark:text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} ITI Mitra. All Rights Reserved.
        </p>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-gray-700/70 text-gray-300 border border-gray-600/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>v{APP_VERSION}</span>
          <span className="text-gray-500">•</span>
          <span className="text-[11px] text-gray-400">{BUILD_DATE}</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
