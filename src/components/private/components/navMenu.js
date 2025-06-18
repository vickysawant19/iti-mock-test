import { ClipboardList } from "lucide-react";
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
  FaUserCircle,
  FaUserPlus,
  FaUserSecret,
} from "react-icons/fa";
import { MdAddCard } from "react-icons/md";

export const menuConfig = [
  {
    // Admin-only group
    group: "Admin",
    roles: ["admin"],
    icon: FaUserSecret,
    groupKey: "admin",
    children: [
      { label: "View modules", path: "/add-modules", icon: MdAddCard },
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
    group: "Batch",
    roles: ["teacher"],
    icon: FaLayerGroup,
    groupKey: "manageBatch",
    children: [
      {
        label: "Students",
        path: "/manage-batch/students",
        icon: FaUserPlus,
      },
      {
        label: "Manage Batch",
        path: "/manage-batch/create",
        icon: FaUserPlus,
      },
      { label: "View Batch", path: "/manage-batch/view", icon: FaUserPlus },
    ],
  },
  {
    //assessment for students
    group: "Assessment",
    icon: ClipboardList,
    groupKey: "assessment",
    children: [
      { label: "Show Assessment", path: "/assessment", icon: MdAddCard },
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
        roles: ["teacher","student"],
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
        path: "/attendance/mark-holidays",
        icon: FaBookReader,
        roles: ["teacher"],
      },
      {
        teacherLabel: "Face Attendance",
        label: "Face Attendance",
        path: "/attendance/face",
        icon: FaUserCircle,
        roles: ["teacher"],
      },
      {
        label: "Mark Daywise Attendance",
        path: "/attendance/mark-attendance",
        icon: FaCalendarCheck,
        roles: ["teacher"],
      },
      {
        teacherLabel: "Mark Student Attendance",
        studentLabel: "Mark My Attendance",
        path: "/attendance/mark-student-attendance",
        icon: FaCalendarCheck,
        roles: ["teacher", "student"],
      },

      {
        teacherLabel: "Check Attendance",
        studentLabel: "Check My Attendance",
        path: "/attendance/check-attendance",
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

// This object maps current paths to headings
export const pathToHeading = {
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
  "/attendance/face": "Face Attendance",
  "/attendance/mark-holidays": "Mark Holidays",
  "/attendance/mark-attendance": "Mark Daywise Attendance",
  "/attendance/mark-student-attendance": "Mark My Attendance",
  "/attendance/check-attendance": "Check My Attendance",
  "/about": "About",
  "/login": "Login",
  "/signup": "SignUp",
};
