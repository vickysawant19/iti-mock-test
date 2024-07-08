import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import {
  FaUserCircle,
  FaBars,
  FaTimes,
  FaHome,
  FaInfoCircle,
  FaFileAlt,
  FaQuestionCircle,
  FaList,
  FaBook,
  FaKey,
} from "react-icons/fa";
import authService from "../appwrite/auth";
import { removeUser } from "../store/userSlice";
import logo from "../assets/logo.jpeg";

const Navbar = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (user) {
        await authService.logout();
        dispatch(removeUser());
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Navbar */}
      <div className="bg-blue-600 h-14 w-full p-3 flex fixed z-10 shadow-md">
        <div className="flex items-center justify-between max-w-screen-lg w-full mx-auto">
          <div className="flex items-center gap-2">
            <button className="text-white text-2xl " onClick={toggleMenu}>
              <FaBars />
            </button>
            <img
              className="w-10 h-10 rounded-full shadow-xl mix-blend-screen"
              src={logo}
              alt="ITI"
            />
            <span className="font-bold text-white text-lg">ITI MOCK TEST</span>
          </div>
          <div className="hidden md:flex text-white gap-6 items-center font-semibold">
            <NavLink
              to="/dash"
              className="flex items-center gap-2 hover:text-gray-200"
            >
              <FaHome />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/about"
              className="flex items-center gap-2 hover:text-gray-200"
            >
              <FaInfoCircle />
              <span>About</span>
            </NavLink>

            {user ? (
              <div className="relative group p-2">
                <FaUserCircle size={24} className="cursor-pointer" />
                <div className="absolute right-0 top-8 w-40 bg-white text-black rounded-md shadow-lg p-2 hidden group-hover:block">
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 hover:bg-gray-200 rounded-md"
                  >
                    Profile
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-200 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <NavLink to="/login" className="hover:text-gray-200">
                  Login
                </NavLink>
                <NavLink to="/signup" className="hover:text-gray-200">
                  SignUp
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sliding Menu */}
      <div
        className={`fixed top-0 left-0 h-full z-20 transition-transform duration-300 transform bg-blue-600 text-white p-4  ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } w-1/2 md:w-1/4`}
      >
        <button className="text-white text-2xl mb-4" onClick={toggleMenu}>
          <FaTimes />
        </button>
        <NavLink
          to="/dash"
          className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
          onClick={toggleMenu}
        >
          <FaHome />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/about"
          className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
          onClick={toggleMenu}
        >
          <FaInfoCircle />
          <span>About</span>
        </NavLink>
        <NavLink
          to="/create-question"
          className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
          onClick={toggleMenu}
        >
          <FaQuestionCircle />
          <span>Create Question</span>
        </NavLink>
        <NavLink
          to="/manage-questions"
          className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
          onClick={toggleMenu}
        >
          <FaList />
          <span>Manage Questions</span>
        </NavLink>
        <NavLink
          to="/mock-exam"
          className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
          onClick={toggleMenu}
        >
          <FaBook />
          <span>Create Mock Exam</span>
        </NavLink>
        <NavLink
          to="/all-mock-tests"
          className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
          onClick={toggleMenu}
        >
          <FaFileAlt />
          <span>View Mock Tests</span>
        </NavLink>
        <NavLink
          to="/attain-test"
          className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
          onClick={toggleMenu}
        >
          <FaKey />
          <span>Attain Test</span>
        </NavLink>
        {user ? (
          <>
            <NavLink
              to="/profile"
              className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
              onClick={toggleMenu}
            >
              <FaUserCircle />
              <span>Profile</span>
            </NavLink>
            <button
              onClick={() => {
                handleLogout();
                toggleMenu();
              }}
              className="block w-full text-left py-2 hover:bg-blue-300 p-2 rounded-xl flex items-center gap-2"
            >
              <FaUserCircle />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
              onClick={toggleMenu}
            >
              <FaUserCircle />
              <span>Login</span>
            </NavLink>
            <NavLink
              to="/signup"
              className="flex items-center gap-2 py-2 hover:bg-blue-300 p-2 rounded-xl"
              onClick={toggleMenu}
            >
              <FaUserCircle />
              <span>SignUp</span>
            </NavLink>
          </>
        )}
      </div>

      {/* Overlay to close the menu */}
      {isMenuOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-10"
          onClick={toggleMenu}
        ></div>
      )}
    </>
  );
};

export default Navbar;
