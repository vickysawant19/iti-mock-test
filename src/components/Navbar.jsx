import React, { useEffect, useState } from "react";
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
  FaDashcube,
} from "react-icons/fa";
import authService from "../appwrite/auth";
import { removeUser } from "../store/userSlice";
import logo from "../assets/logo.jpeg";
import { removeProfile, selectProfile } from "../store/profileSlice";

const Navbar = () => {
  const user = useSelector((state) => state.user);
  const profile = useSelector(selectProfile);

  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (user) {
        await authService.logout();
        dispatch(removeUser());
        dispatch(removeProfile());
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
      <div className="bg-blue-900 h-14 w-full p-3 flex fixed z-10 shadow-md">
        <div className="flex items-center justify-between max-w-screen-lg w-full mx-auto">
          <div className="flex items-center gap-2">
            <button className="text-white text-2xl" onClick={toggleMenu}>
              <FaBars />
            </button>
            <img
              className="w-7 rounded-full shadow-xl mix-blend-screen"
              src={logo}
              alt="ITI"
            />
            <span className="font-bold text-white text-lg">ITI MOCK TEST</span>
          </div>
          <div className="hidden md:flex text-white gap-6 items-center font-semibold">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `flex items-center gap-2 hover:text-gray-200 ${
                  isActive ? "text-gray-300" : ""
                }`
              }
            >
              <FaHome />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `flex items-center gap-2 hover:text-gray-200 ${
                  isActive ? "text-gray-300" : ""
                }`
              }
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
        className={`fixed top-0 left-0 h-full min-w-60 z-20 transition-transform duration-300 transform bg-white text-gray-800 p-6 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } w-fit md:w-1/4 overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-6">
          <img className="w-10" src={logo} alt="logo" />
          <button className="text-gray-800 text-2xl" onClick={toggleMenu}>
            <FaTimes />
          </button>
        </div>
        {user && (
          <div className="flex items-center mb-4 border justify-center rounded-xl py-2">
            <FaUserCircle className="text-4xl text-gray-500 mb-2 mr-2" />
            <div className=" ml-2">
              <span className="text-lg font-semibold px-2">
                {profile?.userName}
              </span>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center px-2 text-base text-blue-800 hover:bg-gray-100 rounded-xl ${
                    isActive ? "bg-gray-100" : ""
                  }`
                }
                onClick={toggleMenu}
              >
                <span>View Profile</span>
              </NavLink>
            </div>
          </div>
        )}
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex items-center gap-4 py-2 mt-4 text-xl hover:bg-gray-100 p-2 rounded-xl ${
              isActive ? "bg-gray-100" : ""
            }`
          }
          onClick={toggleMenu}
        >
          <FaHome />
          <span>Home</span>
        </NavLink>

        {user && (
          <>
            <NavLink
              to="/dash"
              className={({ isActive }) =>
                `flex items-center gap-4 py-2 mt-4 text-xl hover:bg-gray-100 p-2 rounded-xl ${
                  isActive ? "bg-gray-100" : ""
                }`
              }
              onClick={toggleMenu}
            >
              <FaDashcube />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/create-question"
              className={({ isActive }) =>
                `flex items-center gap-4 py-2 mt-4 text-xl hover:bg-gray-100 p-2 rounded-xl ${
                  isActive ? "bg-gray-100" : ""
                }`
              }
              onClick={toggleMenu}
            >
              <FaQuestionCircle />
              <span>Create Question</span>
            </NavLink>
            <NavLink
              to="/manage-questions"
              className={({ isActive }) =>
                `flex items-center gap-4 py-2 mt-4 text-xl hover:bg-gray-100 p-2 rounded-xl ${
                  isActive ? "bg-gray-100" : ""
                }`
              }
              onClick={toggleMenu}
            >
              <FaList />
              <span>Manage Questions</span>
            </NavLink>
            <NavLink
              to="/mock-exam"
              className={({ isActive }) =>
                `flex items-center gap-4 py-2 mt-4 text-xl hover:bg-gray-100 p-2 rounded-xl ${
                  isActive ? "bg-gray-100" : ""
                }`
              }
              onClick={toggleMenu}
            >
              <FaBook />
              <span>Create Mock Exam</span>
            </NavLink>
            <NavLink
              to="/all-mock-tests"
              className={({ isActive }) =>
                `flex items-center gap-4 py-2 mt-4 text-xl hover:bg-gray-100 p-2 rounded-xl ${
                  isActive ? "bg-gray-100" : ""
                }`
              }
              onClick={toggleMenu}
            >
              <FaFileAlt />
              <span>View Mock Tests</span>
            </NavLink>
            <NavLink
              to="/attain-test"
              className={({ isActive }) =>
                `flex items-center gap-4 py-2 mt-4 text-xl hover:bg-gray-100 p-2 rounded-xl ${
                  isActive ? "bg-gray-100" : ""
                }`
              }
              onClick={toggleMenu}
            >
              <FaKey />
              <span>Attain Test</span>
            </NavLink>
          </>
        )}
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `flex items-center gap-4 py-2 mt-4 text-xl hover:bg-gray-100 p-2 rounded-xl ${
              isActive ? "bg-gray-100" : ""
            }`
          }
          onClick={toggleMenu}
        >
          <FaInfoCircle />
          <span>About</span>
        </NavLink>

        {user ? (
          <button
            onClick={() => {
              handleLogout();
              toggleMenu();
            }}
            className="flex items-center gap-2 text-xl mt-4 text-left py-2 hover:bg-gray-100 p-2 rounded-xl w-full"
          >
            <FaUserCircle />
            <span>Logout</span>
          </button>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 mt-4 hover:bg-gray-100 p-2 rounded-xl ${
                  isActive ? "bg-gray-100" : ""
                }`
              }
              onClick={toggleMenu}
            >
              <FaUserCircle />
              <span>Login</span>
            </NavLink>
            <NavLink
              to="/signup"
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 mt-4 hover:bg-gray-100 p-2 rounded-xl ${
                  isActive ? "bg-gray-100" : ""
                }`
              }
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
