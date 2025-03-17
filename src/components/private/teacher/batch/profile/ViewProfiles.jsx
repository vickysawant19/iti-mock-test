import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectProfile } from "../../../../../store/profileSlice";
import { AiOutlineEdit } from "react-icons/ai";
import { format } from "date-fns";

const ViewProfiles = ({ students }) => {
  const profile = useSelector(selectProfile);
  students = students.filter((item) => item.userId !== profile.userId);

  const removeStudentFromBatch = async () => {
    try {
    } catch (error) {
      console.log("Error");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map((student, index) => (
        <div
          key={student.userId || index}
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-semibold">
                  {student.userName?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{student.userName}</h3>
                <p className="text-sm text-gray-500">{student.email}</p>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">Role:</span>{" "}
                <span className="font-medium">
                  {Array.isArray(student.role)
                    ? student.role.join(", ")
                    : student.role || "N/A"}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Status:</span>{" "}
                <span
                  className={`font-medium ${
                    student.status === "Active"
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {student.status}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Phone:</span>{" "}
                <span className="font-medium">{student.phone || "N/A"}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Admission Date:</span>{" "}
                <span className="font-medium">
                  {format(student.enrolledAt, "dd-MM-yyyy") || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to={`${student.userId}`}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                View Profile
              </Link>
              <Link
                to={`/manage-batch/edit/${student.userId}`}
                className=" flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <AiOutlineEdit className="" size={24} />
                <h1 className="font-bold"> Edit</h1>
              </Link>

              <a
                href={`tel:${student.phone}`}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Call
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ViewProfiles;
