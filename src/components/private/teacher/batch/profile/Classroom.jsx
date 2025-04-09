import React from "react";

const Classroom = ({
  rows,
  cols,
  batchStudents,
  findStudentByPosition,
  handleSeatClick,
  getStudentDetails,
}) => {
  // Filter to find unassigned students
  const unassignedStudents = batchStudents.filter(
    (student) =>
      !student.position ||
      student.position.x === -1 ||
      student.position.y === -1
  );

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4">
        Classroom Seating Arrangement
      </h2>
      <div className="bg-gray-100 p-6 rounded-lg">
        <div className="mb-2 p-2 bg-blue-200 text-center rounded">
          Teacher's Desk
        </div>
        <div
          className="grid gap-4"
          style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
        >
          {[...Array(rows)].map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex gap-4 justify-center">
              {[...Array(cols)].map((_, colIndex) => {
                const student = findStudentByPosition(colIndex, rowIndex);
                const studentDetails = student
                  ? getStudentDetails(student.userId)
                  : null;

                return (
                  <div
                    key={`seat-${rowIndex}-${colIndex}`}
                    onClick={() => handleSeatClick(colIndex, rowIndex)}
                    className={`w-20 h-20 rounded-lg flex items-center justify-center cursor-pointer border-2 ${
                      student
                        ? "bg-green-100 border-green-500"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {student ? (
                      <div className="text-center">
                        <div className="font-bold text-sm">
                          {studentDetails?.userName?.charAt(0) || "?"}
                        </div>
                        <div className="text-xs">
                          Seat {rowIndex + 1}-{colIndex + 1}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">Empty</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Unassigned Students</h3>
        {unassignedStudents.length === 0 ? (
          <p className="text-gray-500 italic">
            All students are assigned to seats
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unassignedStudents.map((student) => {
              const studentDetails = getStudentDetails(student.userId);
              return (
                <div
                  key={student.userId}
                  className="bg-yellow-50 p-3 rounded border border-yellow-200"
                >
                  <div className="font-medium">{studentDetails.userName}</div>
                  <div className="text-sm text-gray-600">
                    {studentDetails.studentId}
                  </div>
                  <div className="text-xs italic mt-1">
                    Click on an empty seat to assign
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Classroom;
