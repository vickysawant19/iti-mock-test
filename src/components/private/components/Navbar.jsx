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
  FaUserSecret,
} from "react-icons/fa";

import { MdAddCard } from "react-icons/md";
import logo from "../../../assets/logo.jpeg";
import authService from "../../../appwrite/auth";
import { removeUser } from "../../../store/userSlice";
import { removeProfile, selectProfile } from "../../../store/profileSlice";
import { Menu, X } from "lucide-react";

const Navbar = ({ isNavOpen, setIsNavOpen }) => {
  const user = useSelector((state) => state.user);
  const profile = useSelector(selectProfile);
  const dispatch = useDispatch();
  const [expandedGroup, setExpandedGroup] = useState("");

  const isTeacher = user?.labels.includes("Teacher");
  const isAdmin = user?.labels.includes("admin");
  const isStudent = user && !isTeacher && !isAdmin;

  const navigate = useNavigate();
  const location = useLocation();

  // This object maps current paths to headings
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
    "/daily-dairy": "Daily Diary",
    "/attaindance/mark-holidays": "Mark Holidays",
    "/attaindance/mark-attendance": "Mark Daywise Attendance",
    "/attaindance/mark-student-attendance": isTeacher
      ? "Mark Student Attendance"
      : "Mark My Attendance",
    "/attaindance/check-attendance": isTeacher
      ? "Check Attendance"
      : "Check My Attendance",
    "/about": "About",
    "/login": "Login",
    "/signup": "SignUp",
  };

  const currentHeading = pathToHeading[location.pathname] || "";

  const handleLogout = async () => {
    try {
      if (user) {
        await authService.logout();
        dispatch(removeUser());
        dispatch(removeProfile());
        navigate("/login");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleMenu = () => {
    setIsNavOpen(!isNavOpen);
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

  const MenuItem = ({ to, icon: Icon, children, onClick, img, className }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 py-1.5 text-sm hover:bg-gray-100 px-3 rounded-lg transition-colors duration-200 ${
          isActive ? "bg-gray-100 text-blue-600" : "text-gray-700"
        } ${className}`
      }
      onClick={() => {
        onClick?.();
        toggleMenu();
      }}
    >
      {img ? (
        <img
          className="w-4 h-4 rounded-full object-cover border-1 bg-white border-gray-200"
          src={profile?.profileImage}
          alt="Profile"
        />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      <span>{children}</span>
    </NavLink>
  );

  // Helper to check if the current user has one of the allowed roles
  const hasRole = (roles) => {
    return roles.some((role) => {
      if (role === "teacher") return isTeacher;
      if (role === "admin") return isAdmin;
      if (role === "student") return isStudent;
      return false;
    });
  };

  // Define a configuration object for all the menu links
  const menuConfig = [
    {
      // Admin-only group
      group: "Admin",
      roles: ["admin"],
      icon: FaUserSecret,
      groupKey: "admin",
      children: [
        { label: "Add modules", path: "/add-modules", icon: MdAddCard },
      ],
    },
    {
      // Non-group items available to all logged-in users (or public)
      items: [
        { label: "Home", path: "/home", icon: FaHome },
        {
          label: "Dashboard",
          path: "/dash",
          icon: FaDashcube,
          requiresAuth: true,
        },
      ],
    },
    {
      // Teacher-only group for batch management
      group: "Manage Batch",
      roles: ["teacher"],
      icon: FaLayerGroup,
      groupKey: "manageBatch",
      children: [
        {
          label: "Create/Update Batch",
          path: "/manage-batch/create",
          icon: FaUserPlus,
        },
        { label: "View Batch", path: "/manage-batch/view", icon: FaUserPlus },
      ],
    },
    {
      // Mock Tests group – some items only for teachers
      group: "Mock Tests",
      icon: FaBook,
      groupKey: "mockTests",
      children: [
        {
          label: "Create Question",
          path: "/create-question",
          icon: FaQuestionCircle,
          roles: ["teacher"],
        },
        {
          label: "Manage Questions",
          path: "/manage-questions",
          icon: FaList,
          roles: ["teacher"],
        },
        {
          label: "Create Mock Exam",
          path: "/mock-exam",
          icon: FaBook,
          roles: ["teacher"],
        },
        { label: "My Mock Tests", path: "/all-mock-tests", icon: FaFileAlt },
        { label: "Attain Test", path: "/attain-test", icon: FaKey },
      ],
    },
    {
      // Attendance group – with alternate labels based on role.
      group: "Attendance",
      icon: FaCalendarCheck,
      groupKey: "attendance",
      children: [
        { label: "Daily Diary", path: "/daily-dairy", icon: FaBookReader },
        {
          label: "Mark Holidays",
          path: "/attaindance/mark-holidays",
          icon: FaBookReader,
          roles: ["teacher"],
        },
        {
          label: "Mark Daywise Attendance",
          path: "/attaindance/mark-attendance",
          icon: FaCalendarCheck,
          roles: ["teacher"],
        },
        {
          teacherLabel: "Mark Student Attendance",
          studentLabel: "Mark My Attendance",
          path: "/attaindance/mark-student-attendance",
          icon: FaCalendarCheck,
          roles: ["teacher", "student"],
        },
        {
          teacherLabel: "Check Attendance",
          studentLabel: "Check My Attendance",
          path: "/attaindance/check-attendance",
          icon: FaCalendarAlt,
          roles: ["teacher", "student"],
        },
      ],
    },
    {
      // Public items (or available for all users)
      items: [{ label: "About", path: "/about", icon: FaInfoCircle }],
    },
  ];

  return (
    <>
      {/* Top Navbar */}
      <div className={`bg-blue-900 h-12 w-full flex fixed z-20 shadow-md`}>
        <div className="flex items-center justify-between w-full mx-auto px-3 transition-all duration-300 ease-in-out">
          <div className="flex items-center gap-3 w-full ">
            <div className="relative w-10 h-10 md:hidden">
              <button
                aria-label={isNavOpen ? "Close Menu" : "Open Menu"}
                onClick={toggleMenu}
                className="w-full h-full p-2 rounded-lg hover:bg-white/10 transition-colors duration-300 "
              >
                {isNavOpen ? (
                  <X className="w-full h-full text-white transform transition-all duration-300 rotate-90 animate-in" />
                ) : (
                  <Menu className="w-full h-full text-white transform transition-all duration-300 animate-in" />
                )}
              </button>
            </div>
            <img
              className="w-6 h-6 rounded-full shadow-xl mix-blend-screen"
              src={logo}
              alt="ITI"
            />
            {currentHeading && (
              <span className="text-white text-sm"> {currentHeading}</span>
            )}
          </div>
          <div className="hidden md:flex text-white gap-4 items-center md:justify-end w-full">
            {user ? (
              <div className="relative group py-1 px-2">
                {profile?.profileImage ? (
                  <img
                    className="w-8 h-8 rounded-full object-cover border-1 bg-white border-gray-200"
                    src={profile?.profileImage}
                    alt="Profile"
                  />
                ) : (
                  <FaUserCircle className="text-gray-400 w-10 h-10" />
                )}
                <div className="absolute right-0 top-6 w-36 bg-white text-gray-800 rounded-lg shadow-lg py-1 hidden group-hover:block border border-gray-100">
                  <MenuItem
                    to="/profile"
                    icon={FaUserCircle}
                    img={profile?.profileImage}
                  >
                    Profile
                  </MenuItem>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-100 text-red-600 "
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <MenuItem
                  className="text-black hover:bg-white hover:text-black"
                  to="/login"
                  icon={FaUserCircle}
                >
                  Login
                </MenuItem>
                <MenuItem
                  className="text-black hover:bg-white hover:text-black"
                  to="/signup"
                  icon={FaUserCircle}
                >
                  SignUp
                </MenuItem>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sliding Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-72 z-10 transition-transform duration-300 transform bg-white md:translate-x-0 text-gray-800 overflow-y-auto shadow-2xl md:shadow-none ${
          isNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="w-full h-full flex flex-col pt-14 p-4">
          {user && (
            <div className="py-2 pb-4">
              <div className="flex items-center bg-gray-50 rounded-lg py-3 px-4 ">
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
            </div>
          )}

          <div className="flex-grow space-y-2">
            {menuConfig.map((configItem, index) => {
              // Check if the entire group/item has a roles restriction
              if (configItem.roles && !hasRole(configItem.roles)) return null;
              if (configItem.group) {
                return (
                  <MenuGroup
                    key={index}
                    title={configItem.group}
                    groupKey={configItem.groupKey}
                    icon={configItem.icon}
                  >
                    {configItem.children.map((child, idx) => {
                      if (child.requiresAuth && !user) return null;
                      if (child.roles && !hasRole(child.roles)) return null;
                      let label = child.label;
                      if (child.teacherLabel && child.studentLabel) {
                        label = isTeacher
                          ? child.teacherLabel
                          : child.studentLabel;
                      }
                      return (
                        <MenuItem key={idx} to={child.path} icon={child.icon}>
                          {label}
                        </MenuItem>
                      );
                    })}
                  </MenuGroup>
                );
              } else if (configItem.items) {
                return configItem.items.map((child, idx) => {
                  if (child.requiresAuth && !user) return null;
                  if (child.roles && !hasRole(child.roles)) return null;
                  let label = child.label;
                  if (child.teacherLabel && child.studentLabel) {
                    label = isTeacher ? child.teacherLabel : child.studentLabel;
                  }
                  return (
                    <MenuItem key={idx} to={child.path} icon={child.icon}>
                      {label}
                    </MenuItem>
                  );
                });
              }
              return null;
            })}
          </div>

          <div className="mt-auto pt-4">
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="flex items-center gap-2 w-full py-1.5 text-sm hover:bg-red-50 px-3 rounded-lg text-red-600 justify-center border border-red-200 md:hidden"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <MenuItem className="md:hidden" to="/login" icon={FaUserCircle}>
                  Login
                </MenuItem>
                <MenuItem
                  className="md:hidden"
                  to="/signup"
                  icon={FaUserCircle}
                >
                  SignUp
                </MenuItem>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isNavOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-[5] md:hidden"
          onClick={toggleMenu}
        ></div>
      )}
    </>
  );
};

export default Navbar;
