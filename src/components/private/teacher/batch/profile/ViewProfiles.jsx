import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectProfile } from "../../../../../store/profileSlice";
import { AiOutlineEdit } from "react-icons/ai";
import { format } from "date-fns";

const ViewProfiles = ({ students }) => {
  const profile = useSelector(selectProfile);

  if (!students || !students.length) {
    return (
      <div className="text-center text-gray-500 py-10">
        No students found in this batch
      </div>
    );
  }

  // Filter out the current user's profile
  const filteredStudents = useMemo(() => {
    return students.filter((student) => student.userId !== profile.userId);
  }, [students, profile.userId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredStudents.map((student, index) => (
        <div
          key={student.userId || index}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          {/* Header section with avatar and basic info */}
          <div className="flex p-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-700 mr-4">
              {student.userName?.charAt(0) || "U"}
            </div>
            <div className="grow">
              <h2 className="text-lg font-semibold">{student.userName}</h2>
              <p className="text-sm text-gray-500">{student.email}</p>
              <p className="text-sm text-gray-500">
                Student ID: {student.studentId || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Role:{" "}
                {Array.isArray(student.role)
                  ? student.role.join(", ")
                  : student.role || "N/A"}
              </p>
            </div>
          </div>
          {/* Detail section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Link
                to={`${student.userId}`}
                className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 transition-colors text-sm"
              >
                View Profile
              </Link>
              <Link
                to={`/manage-batch/edit/${student.userId}`}
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 transition-colors text-sm"
              >
                <AiOutlineEdit size={20} />
                <span>Edit</span>
              </Link>
              <a
                href={`tel:${student.phone}`}
                className="px-4 py-2 bg-green-500 text-white rounded-sm hover:bg-green-600 transition-colors text-sm"
              >
                Call
              </a>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={
                    student.status === "Active"
                      ? "text-green-600"
                      : "text-gray-600"
                  }
                >
                  {student.status}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone:</span>{" "}
                {student.phone || "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Admission Date:</span>{" "}
                {student.enrolledAt
                  ? format(new Date(student.enrolledAt), "dd-MM-yyyy")
                  : "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-medium">DOB:</span>{" "}
                {student.DOB
                  ? format(new Date(student.DOB), "dd-MM-yyyy")
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ViewProfiles;
