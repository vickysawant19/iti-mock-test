import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  FaSignOutAlt,
  FaChevronDown,
  FaCalendarCheck,
  FaCalendarAlt,
  FaBookReader,
  FaUserPlus,
  FaUsers,
  FaLayerGroup,
} from "react-icons/fa";

import logo from "../../../assets/logo.jpeg";
import authService from "../../../appwrite/auth";
import { removeUser } from "../../../store/userSlice";
import { removeProfile, selectProfile } from "../../../store/profileSlice";

const Navbar = () => {
  const user = useSelector((state) => state.user);
  const profile = useSelector(selectProfile);
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState("");

  const userRole = user?.labels || [];

  const navigate = useNavigate();
  const location = useLocation();

  const pathToHeading = {
    "/": "Home",
    "/home": "Home",
    "/dash": "Dashboard",
    "/profile": "Profile",
    "/manage-batch/create": "Create/Update Batch",
    "/manage-batch/view": "View Batch Students",
    "/create-question": "Create Question",
    "/manage-questions": "Manage Questions",
    "/mock-exam": "Create Mock Exam",
    "/all-mock-tests": "My Mock Tests",
    "/attain-test": "Attain Test",
    "/attaindance/daily-diary": "Daily Diary",
    "/attaindance/mark-attendance": "Mark Daywise Attendance",
    "/attaindance/mark-student-attendance": "Mark Student Attendance",
    "/attaindance/check-attendance": "Check Attendance",
    "/about": "About",
    "/login": "Login",
    "/signup": "SignUp",
  };

  // Get the current heading based on the path
  const currentHeading = pathToHeading[location.pathname] || "";

  const handleLogout = async () => {
    try {
      if (user) {
        await authService.logout();
        dispatch(removeUser());
        dispatch(removeProfile());
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleGroup = (group) => {
    setExpandedGroup(expandedGroup === group ? "" : group);
  };

  const MenuGroup = ({ title, icon: Icon, children, groupKey }) => (
    <div className="mt-2">
      <button
        onClick={() => toggleGroup(groupKey)}
        className="flex items-center gap-2 w-full py-1.5 text-sm hover:bg-gray-100 px-3 rounded-lg transition-colors duration-200"
      >
        <Icon className="text-gray-600 w-4 h-4" />
        <span className="font-medium">{title}</span>
        <FaChevronDown
          className={`ml-auto w-3 h-3 transform transition-transform duration-200 ${
            expandedGroup === groupKey ? "rotate-180" : ""
          }`}
        />
      </button>
      {expandedGroup === groupKey && (
        <div className="ml-6 mt-1 space-y-1">{children}</div>
      )}
    </div>
  );

  const MenuItem = ({ to, icon: Icon, children, onClick }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 py-1.5 text-sm hover:bg-gray-100 px-3 rounded-lg transition-colors duration-200 ${
          isActive ? "bg-gray-100 text-blue-600" : "text-gray-700"
        }`
      }
      onClick={() => {
        onClick?.();
        toggleMenu();
      }}
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </NavLink>
  );

  return (
    <>
      {/* Navbar */}
      <div className="bg-blue-900 h-12 w-full flex fixed z-10 shadow-md">
        <div className="flex items-center justify-between max-w-screen-lg w-full mx-auto px-3">
          <div className="flex items-center gap-3 w-full">
            <button
              className="text-white text-xl hover:scale-105 transition-transform duration-300 "
              onClick={toggleMenu}
            >
              <FaBars />
            </button>
            <img
              className="w-6 h-6 rounded-full shadow-xl mix-blend-screen"
              src={logo}
              alt="ITI"
            />
            {currentHeading && (
              <span className="text-white text-sm"> {currentHeading}</span>
            )}
          </div>
          <div className="hidden md:flex text-white gap-4 items-center">
            {user ? (
              <div className="relative group py-1 px-2">
                <FaUserCircle className="w-5 h-5 cursor-pointer" />
                <div className="absolute right-0 top-6 w-36 bg-white text-gray-800 rounded-lg shadow-lg py-1 hidden group-hover:block border border-gray-100">
                  <MenuItem to="/profile" icon={FaUserCircle}>
                    Profile
                  </MenuItem>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-100 text-red-600"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <MenuItem to="/login" icon={FaUserCircle}>
                  Login
                </MenuItem>
                <MenuItem to="/signup" icon={FaUserCircle}>
                  SignUp
                </MenuItem>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sliding Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-72 z-20 transition-transform duration-300 transform bg-white text-gray-800 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto shadow-2xl `}
      >
        <div className="w-full h-full p-4 flex flex-col ">
          <div className="flex items-center justify-between mb-6 border-b pb-4  ">
            <div className="flex items-center gap-3  w-full">
              <img className="w-8 h-8 rounded-md" src={logo} alt="logo" />
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `font-semibold text-gray-800 text-sm text-center w-full hover:text-blue-600 transition-colors ${
                    isActive ? "text-blue-600" : ""
                  }`
                }
              >
                ITI MOCK TEST
              </NavLink>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={toggleMenu}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>

          {user && (
            <div className="flex items-center mb-6 bg-gray-50 rounded-lg py-3 px-4 ">
              {profile?.profileImage ? (
                <img
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  src={profile?.profileImage}
                  alt="Profile"
                />
              ) : (
                <FaUserCircle className="text-gray-400 w-10 h-10" />
              )}
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-800 block">
                  {profile?.userName}
                </span>
                <NavLink
                  to="/profile"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={toggleMenu}
                >
                  View Profile
                </NavLink>
              </div>
            </div>
          )}

          <div className="flex-grow space-y-2">
            <MenuItem to="/home" icon={FaHome}>
              Home
            </MenuItem>

            {user && (
              <>
                <MenuItem to="/dash" icon={FaDashcube}>
                  Dashboard
                </MenuItem>
                {userRole.includes("Teacher") && (
                  <MenuGroup
                    title="Manage Batch"
                    icon={FaLayerGroup}
                    groupKey="manageBatch"
                  >
                    <MenuItem to="manage-batch/create" icon={FaUserPlus}>
                      Create/Update Batch
                    </MenuItem>
                    <MenuItem to="manage-batch/view" icon={FaUserPlus}>
                      View Batch Students
                    </MenuItem>
                  </MenuGroup>
                )}

                {/* Mock Test Group */}
                <MenuGroup
                  title="Mock Tests"
                  icon={FaBook}
                  groupKey="mockTests"
                >
                  {user?.labels.includes("Teacher") && (
                    <>
                      <MenuItem to="/create-question" icon={FaQuestionCircle}>
                        Create Question
                      </MenuItem>
                      <MenuItem to="/manage-questions" icon={FaList}>
                        Manage Questions
                      </MenuItem>
                      <MenuItem to="/mock-exam" icon={FaBook}>
                        Create Mock Exam
                      </MenuItem>
                    </>
                  )}
                  <MenuItem to="/all-mock-tests" icon={FaFileAlt}>
                    My Mock Tests
                  </MenuItem>
                  <MenuItem to="/attain-test" icon={FaKey}>
                    Attain Test
                  </MenuItem>
                </MenuGroup>

                {/* Attendance Group */}
                <MenuGroup
                  title="Attendance"
                  icon={FaCalendarCheck}
                  groupKey="attendance"
                >
                  {userRole.includes("Teacher") && (
                    <>
                      <MenuItem
                        to="/attaindance/daily-diary"
                        icon={FaBookReader}
                      >
                        Daily Diary
                      </MenuItem>
                      <MenuItem
                        to="/attaindance/mark-attendance"
                        icon={FaCalendarCheck}
                      >
                        Mark Daywise Attendance
                      </MenuItem>
                    </>
                  )}
                  <MenuItem
                    to="/attaindance/mark-student-attendance"
                    icon={FaCalendarCheck}
                  >
                    Mark Student Attendance
                  </MenuItem>
                  <MenuItem
                    to="/attaindance/check-attendance"
                    icon={FaCalendarAlt}
                  >
                    Check Attendance
                  </MenuItem>
                </MenuGroup>
              </>
            )}

            <MenuItem to="/about" icon={FaInfoCircle}>
              About
            </MenuItem>
          </div>

          <div className="mt-auto pt-4">
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="flex items-center gap-2 w-full py-1.5 text-sm hover:bg-red-50 px-3 rounded-lg text-red-600 justify-center border border-red-200"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <MenuItem to="/login" icon={FaUserCircle}>
                  Login
                </MenuItem>
                <MenuItem to="/signup" icon={FaUserCircle}>
                  SignUp
                </MenuItem>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleMenu}
        ></div>
      )}
    </>
  );
};

export default Navbar;
