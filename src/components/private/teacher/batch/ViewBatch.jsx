import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../store/userSlice";
import { selectProfile } from "../../../../store/profileSlice";
import userProfileService from "../../../../appwrite/userProfileService";
import { Link } from "react-router-dom";

const ViewBatch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const fetchBatchStudent = async (query) => {
    setIsLoading(true);
    try {
      const data = await userProfileService.getBatchUserProfile(query);
      setStudents(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error("Error fetching batch students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory !== "") {
      fetchBatchStudent({
        key: selectedCategory,
        value: profile[selectedCategory],
      });
    }
  }, [selectedCategory]);

  const handleEditProfile = (userId) => {
    console.log("Edit profile for:", userId);
    // Add your edit profile logic here
  };

  const handleMessage = (userId) => {
    console.log("Message user:", userId);
    // Add your messaging logic here
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="w-full p-2 flex justify-end">
        <select
          className="p-2 rounded-md  right-0"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Select the category</option>
          <option value={"batchId"}>Batch</option>
          <option value={"tradeId"}>Trade</option>
          <option value={"collegeId"}>College</option>
        </select>
      </div>
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
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`${student.userId}`}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => handleEditProfile(student.userId)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleMessage(student.userId)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Message
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewBatch;
