import React from "react";
import { AiOutlineClose, AiOutlineUserAdd } from "react-icons/ai";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * ApprovalToggle – small inline toggle button for a batch student row.
 */
const ApprovalToggle = ({ studentProfile, toggleApproval }) => {
  const [loading, setLoading] = useState(false);

  if (!studentProfile) return null;

  const isApproved = studentProfile.isApproved;
  const isPending = studentProfile.approvalStatus === "pending" || !studentProfile.approvalStatus;

  const handleClick = async () => {
    setLoading(true);
    await toggleApproval(studentProfile);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={isApproved ? "Click to revoke access" : "Click to approve"}
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-60 ${
        isApproved
          ? "bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-400"
          : isPending
          ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400"
          : "bg-red-50 border-red-200 text-red-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isApproved ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : (
        <XCircle className="w-3.5 h-3.5" />
      )}
      {loading ? "..." : isApproved ? "Approved" : isPending ? "Pending" : "Rejected"}
    </button>
  );
};

const ListView = ({
  batchStudents,
  studentsData,
  getStudentDetails,
  removeStudentFromBatch,
  addStudentToBatch,
  students,
  toggleApproval,
}) => {
  // Build a map from userId → full profile (for approval status)
  const profileMap = {};
  (studentsData || []).forEach((s) => {
    profileMap[s.userId] = s;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-gray-900">
      {/* Current Batch Students */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Batch Students
        </h2>
        {batchStudents.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No students in this batch yet
          </p>
        ) : (
          <div className="space-y-4">
            {batchStudents.map((batchStudent, index) => {
              const studentDetails = getStudentDetails(batchStudent.userId);
              const studentProfile = profileMap[batchStudent.userId];

              return (
                <div
                  key={batchStudent.userId || index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                >
                  <div className="flex p-4 items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-lg font-bold text-blue-700 dark:text-blue-300 shrink-0">
                      {studentDetails.userName?.charAt(0) || "U"}
                    </div>
                    <div className="grow min-w-0">
                      <h3 className="text-base font-semibold text-gray-800 dark:text-white truncate">
                        {studentDetails.userName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {studentDetails.studentId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {studentDetails.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-sm">
                          {batchStudent.status}
                        </span>
                        {batchStudent.position && batchStudent.position.x >= 0 ? (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-sm">
                            Seat: Row {batchStudent.position.y + 1}, Col{" "}
                            {batchStudent.position.x + 1}
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-sm">
                            Not seated
                          </span>
                        )}
                        {/* ── Approval Toggle ── */}
                        {toggleApproval && (
                          <ApprovalToggle
                            studentProfile={studentProfile}
                            toggleApproval={toggleApproval}
                          />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeStudentFromBatch(batchStudent.userId)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 shrink-0 mt-1"
                      title="Remove from batch"
                    >
                      <AiOutlineClose size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Students to add */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Available Students
        </h2>
        {students.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No more students available to add
          </p>
        ) : (
          <div className="space-y-4">
            {students.map((student, index) => (
              <div
                key={student.userId || index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                <div className="flex p-4 items-start gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-lg font-bold text-gray-700 dark:text-gray-300 shrink-0">
                    {student.userName?.charAt(0) || "U"}
                  </div>
                  <div className="grow min-w-0">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white truncate">
                      {student.userName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {student.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {student.studentId || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() => addStudentToBatch(student)}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600 shrink-0 mt-1"
                    title="Add to batch"
                  >
                    <AiOutlineUserAdd size={22} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
