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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Current Batch Students */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Batch Students</h2>
        {batchStudents.length === 0 ? (
          <p className="text-gray-500 italic">No students in this batch yet</p>
        ) : (
          <div className="space-y-4">
            {batchStudents.map((batchStudent, index) => {
              const studentDetails = getStudentDetails(batchStudent.userId);

              return (
                <div
                  key={batchStudent.userId || index}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="flex p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-700 mr-4">
                      {studentDetails.userName?.charAt(0) || "U"}
                    </div>
                    <div className="grow">
                      <h3 className="text-lg font-semibold ">
                        {studentDetails.userName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {studentDetails.studentId}
                      </p>
                      <p className="text-sm text-gray-500">
                        {studentDetails.email}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-sm mr-2">
                          {batchStudent.status}
                        </span>
                        {batchStudent.position &&
                        batchStudent.position.x >= 0 ? (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-sm">
                            Seat: Row {batchStudent.position.y + 1}, Col{" "}
                            {batchStudent.position.x + 1}
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-sm">
                            Not seated
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        removeStudentFromBatch(batchStudent.userId)
                      }
                      className="text-red-500 hover:text-red-700"
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
        <h2 className="text-xl font-semibold mb-4">Available Students</h2>
        {students.length === 0 ? (
          <p className="text-gray-500 italic">
            No more students available to add
          </p>
        ) : (
          <div className="space-y-4">
            {students.map((student, index) => (
              <div
                key={student.userId || index}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="flex p-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-700 mr-4">
                    {student.userName?.charAt(0) || "U"}
                  </div>
                  <div className="grow">
                    <h3 className="text-lg font-semibold">
                      {student.userName}
                    </h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    <p className="text-sm text-gray-500">
                      Student ID: {student.studentId || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() => addStudentToBatch(student)}
                    className="text-blue-500 hover:text-blue-700"
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
