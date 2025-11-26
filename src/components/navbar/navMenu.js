import { ClipboardList, Group } from "lucide-react";
import {
  FaBook,
  FaBookReader,
  FaCalendarAlt,
  FaCalendarCheck,
  FaDashcube,
  FaFileAlt,
  FaHome,
  FaInfoCircle,
  FaKey,
  FaLayerGroup,
  FaList,
  FaQuestionCircle,
  FaRegCalendarCheck,
  FaTasks,
  FaUserCircle,
  FaUserPlus,
  FaUserSecret,
} from "react-icons/fa";
import { MdAddCard, MdGroupAdd, MdOutlineGroupAdd } from "react-icons/md";

export const menuConfig = [
  {
    // Admin-only group
    group: "Admin",
    roles: ["admin"],
    icon: FaUserSecret,
    groupKey: "admin",
    requiresAuth: true,
    children: [
      { label: "Modules", path: "/add-modules", icon: MdAddCard, requiresAuth: true },
      { label: "Questions", path: "/add-bulk-questions", icon: Group, requiresAuth: true },

    ],
  },
  {
    // Non-group items available to all logged-in users (or public)
    items: [
      { label: "Home", path: "/", icon: FaHome },
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
    group: "Batch",
    roles: ["teacher"],
    icon: FaLayerGroup,
    groupKey: "manageBatch",
    requiresAuth: true,
    children: [
      {
        label: "Students",
        path: "/manage-batch/students",
        icon: FaUserPlus,
        requiresAuth: true,
      },
      {
        label: "Manage Batch",
        path: "/manage-batch/create",
        icon: FaUserPlus,
        requiresAuth: true,
      },
      { label: "View Batch", path: "/manage-batch/view", icon: FaUserPlus, requiresAuth: true },
    ],
  },
  {
    //assessment for students
    group: "Assessment",
    icon: ClipboardList,
    groupKey: "assessment",
    requiresAuth: true,
    children: [
      { label: "Show Assessment", path: "/assessment", icon: MdAddCard, requiresAuth: true },
    ],
  },
  {
    // Mock Tests group – some items only for teachers
    group: "Mock Tests",
    icon: FaBook,
    groupKey: "mockTests",
    requiresAuth: true,
    children: [
      {
        label: "Create Question",
        path: "/create-question",
        icon: FaQuestionCircle,
        roles: ["teacher"],
        requiresAuth: true,
      },
      {
        label: "Manage Questions",
        path: "/manage-questions",
        icon: FaList,
        roles: ["teacher"],
        requiresAuth: true,
      },
      {
        label: "Create Mock Exam",
        path: "/mock-exam",
        icon: FaBook,
        roles: ["teacher", "student"],
        requiresAuth: true,
      },
      { label: "My Mock Tests", path: "/all-mock-tests", icon: FaFileAlt, requiresAuth: true },
      { label: "Attain Test", path: "/attain-test", icon: FaKey, requiresAuth: true },
    ],
  },
  {
    // Attendance group – with alternate labels based on role.
    group: "Attendance",
    icon: FaCalendarCheck,
    groupKey: "attendance",
    requiresAuth: true,
    children: [
      { label: "Daily Diary", path: "/daily-dairy", icon: FaBookReader, requiresAuth: true },
      {
        teacherLabel: "Student Attendance Record",
        studentLabel: "My Attendance Log",
        path: "/attendance/mark-student-attendance",
        icon: FaTasks,
        roles: ["teacher", "student"],
        requiresAuth: true,
      },
      {
        label: "Attendance Register",
        path: "/attendance/register",
        icon: FaCalendarAlt,
        roles: ["teacher"],
        requiresAuth: true,
      },
      {
        label: "Quick Mark",
        path: "/attendance/marktoday",
        icon: FaRegCalendarCheck,
        roles: ["teacher", "student"],
        requiresAuth: true,
      },
      {
        label: "College Attendance",
        path: "/attendance/college-attendance",
        icon: FaCalendarCheck,
        roles: ["admin", "teacher"],
        requiresAuth: true,
      },
    ],
  },
  {
    // Public items (or available for all users)
    items: [{ label: "About", path: "/about", icon: FaInfoCircle }],
  },
];

// This object maps current paths to headings
export const pathToHeading = {
  "/": "Home",
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
  "/attendance/face": "Face Attendance",
  "/attendance/mark-holidays": "Mark Holidays",
  "/attendance/mark-attendance": "Mark Daywise Attendance",
  "/attendance/mark-student-attendance": "Mark My Attendance",
  "/attendance/tracer": "Attendance Register",
  "/attendance/check-attendance": "Check My Attendance",
  "/about": "About",
  "/login": "Login",
  "/signup": "SignUp",
};
