import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-600 text-white pb-9">
      <div className="container px-2 py-8 mx-auto flex justify-center">
        <div className="grid grid-cols-1  gap-6 gap-y-5 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-6 ">
          <div className="sm:col-span-3">
            <h1 className="text-xl font-bold text-gray-200 md:text-center xl:text-2xl">
              Subscribe to Our Newsletter
            </h1>
            <div className="flex flex-col items-center mt-6 space-y-3 md:flex-row md:space-y-0 justify-center">
              <input
                type="text"
                className="px-4 py-2 text-gray-200 bg-white border rounded-md focus:border-blue-400 dark:focus:border-blue-300 focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-blue-300"
                placeholder="Your Email Address"
              />
              <button className="w-full px-6 py-2.5 text-sm font-medium tracking-wider text-white transition-colors duration-300 transform md:w-auto md:mx-4 focus:outline-none bg-gray-800 rounded-lg hover:bg-gray-700 focus:ring focus:ring-gray-300 focus:ring-opacity-80">
                Subscribe
              </button>
            </div>
          </div>

          <div className="">
            <p className="font-semibold text-gray-700">Quick Links</p>
            <div className="flex flex-col items-start mt-5 space-y-2">
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Home
              </a>
              <a href="#" className="text-gray-200 hover:text-blue-700">
                About Us
              </a>
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Contact Us
              </a>
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Services
              </a>
            </div>
          </div>

          <div>
            <p className="font-semibold text-gray-700">Resources</p>
            <div className="flex flex-col items-start mt-5 space-y-2">
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Mock Tests
              </a>
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Practice Questions
              </a>
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Study Tips
              </a>
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Exam Strategies
              </a>
            </div>
          </div>

          <div>
            <p className="font-semibold text-gray-700">Legal</p>
            <div className="flex flex-col items-start mt-5 space-y-2">
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Terms & Conditions
              </a>
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-200 hover:text-blue-700">
                Cookies Policy
              </a>
            </div>
          </div>
        </div>
      </div>
      <hr className="mt-5 mx-5" />
      <div className="m-5">
        <p className="text-center text-gray-200">
          &copy; {new Date().getFullYear()} ITI Mock Test. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
