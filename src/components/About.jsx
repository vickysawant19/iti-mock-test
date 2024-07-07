import React from "react";
import Footer from "./Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-100 ">
      <div className="container mx-auto px-4 py-10">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">
            About Us
          </h1>
          <p className="text-gray-600 mb-4">
            Welcome to our Mock Test Website! Our platform is designed to help
            students prepare for their exams by providing them with a robust and
            user-friendly interface to take mock tests, create questions, and
            manage their progress. Our goal is to assist students in securing
            good scores in their actual exams through regular practice and
            self-assessment.
          </p>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            Features
          </h2>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Login to access personalized test environment</li>
            <li>Attempt a variety of mock exams</li>
            <li>Create your own questions for practice</li>
            <li>Manage and review your test results</li>
          </ul>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            Our Mission
          </h2>
          <p className="text-gray-600 mb-4">
            Our mission is to provide students with an effective tool for exam
            preparation. We believe that regular practice and self-assessment
            are key to achieving high scores in any exam. Our platform is
            designed to make this process easy, accessible, and efficient.
          </p>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            About the Creator
          </h2>
          <p className="text-gray-600 mb-4">
            This app is managed by Vitthal Sawant. If you have any suggestions
            for improvement or need assistance, feel free to contact me at{" "}
            <a
              href="mailto:vitthal.sawant19@gmail.com"
              className="text-blue-500 underline"
            >
              vitthal.sawant19@gmail.com
            </a>
            .
          </p>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            Contact Us
          </h2>
          <p className="text-gray-600">
            We value your feedback and suggestions. Please reach out to us at
            any time to help us improve our platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
