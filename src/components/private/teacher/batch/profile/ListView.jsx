import React from "react";
import { AiOutlineClose, AiOutlineUserAdd } from "react-icons/ai";

const ListView = ({
  batchStudents,
  getStudentDetails,
  removeStudentFromBatch,
  addStudentToBatch,
  students,
}) => {
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

              return (
                <div
                  key={batchStudent.userId || index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                >
                  <div className="flex p-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-lg font-bold text-blue-700 dark:text-blue-300 mr-4">
                      {studentDetails.userName?.charAt(0) || "U"}
                    </div>
                    <div className="grow">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {studentDetails.userName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {studentDetails.studentId}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {studentDetails.email}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-sm mr-2">
                          {batchStudent.status}
                        </span>
                        {batchStudent.position &&
                        batchStudent.position.x >= 0 ? (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-sm">
                            Seat: Row {batchStudent.position.y + 1}, Col{" "}
                            {batchStudent.position.x + 1}
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-sm">
                            Not seated
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        removeStudentFromBatch(batchStudent.userId)
                      }
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
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

      {/* Pending Students */}
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
                <div className="flex p-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-lg font-bold text-gray-700 dark:text-gray-300 mr-4">
                    {student.userName?.charAt(0) || "U"}
                  </div>
                  <div className="grow">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {student.userName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {student.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Student ID: {student.studentId || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() => addStudentToBatch(student)}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600"
                  >
                    <AiOutlineUserAdd size={20} />
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
