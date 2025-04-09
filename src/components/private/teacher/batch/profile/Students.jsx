import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../../../store/profileSlice";
import { AiOutlineUserAdd, AiOutlineClose } from "react-icons/ai";
import { toast } from "react-toastify";
import batchService from "../../../../../appwrite/batchService";
import userProfileService from "../../../../../appwrite/userProfileService";
import { Query } from "appwrite";
import Classroom from "./Classroom"; // Import the new Classroom component

const Students = ({ batchId }) => {
  const profile = useSelector(selectProfile);
  const [studentsData, setStudentsData] = useState([]);
  const [students, setStudents] = useState([]);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classroomView, setClassroomView] = useState(false);

  // Classroom dimensions
  const rows = 5;
  const cols = 6;

  // Create a map of studentData for efficient access
  const studentDataMap = useMemo(() => {
    const map = {};
    studentsData.forEach((student) => {
      map[student.userId] = student;
    });
    return map;
  }, [studentsData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all students and batch details
        const allStudents = await userProfileService.getBatchUserProfile([
          Query.equal("batchId", batchId),
        ]);

        setStudentsData(allStudents);
        const batchDetails = await batchService.getBatch(batchId);

        const batchStudentsParsed = batchDetails.studentIds.map((itm) =>
          JSON.parse(itm)
        );

        setBatchStudents(batchStudentsParsed);

        if (allStudents) {
          // Filter out students that are already in the batch
          const pendingStudents = allStudents.filter(
            (student) =>
              !batchStudentsParsed.some((bs) => bs.userId === student.userId)
          );
          setStudents(pendingStudents);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [batchId]);

  const addStudentToBatch = async (student) => {
    try {
      // Add student to batch with default position (0,0)
      const newBatchStudent = {
        userId: student.userId,
        status: "Active",
        position: { x: 0, y: 0 },
      };

      const updatedBatchStudents = [...batchStudents, newBatchStudent];
      setBatchStudents(updatedBatchStudents);

      // Remove from pending students list
      setStudents(students.filter((s) => s.userId !== student.userId));

      // Update batch with new student list
      await batchService.updateBatch(batchId, {
        studentIds: updatedBatchStudents.map((itm) => JSON.stringify(itm)),
      });
      toast.success(`${student.userName} added to batch`);
    } catch (error) {
      console.error("Error adding student to batch:", error);
      toast.error("Failed to add student to batch");
    }
  };

  const removeStudentFromBatch = async (userId) => {
    try {
      // Remove student from batch
      const updatedBatchStudents = batchStudents.filter(
        (s) => s.userId !== userId
      );
      setBatchStudents(updatedBatchStudents);

      // Find student details from our existing map to add back to pending list
      const studentToAdd = studentDataMap[userId];
      if (studentToAdd) {
        setStudents((prevStudents) => [...prevStudents, studentToAdd]);
      }

      // Update batch with new student list
      await batchService.updateBatch(batchId, {
        studentIds: updatedBatchStudents.map((itm) => JSON.stringify(itm)),
      });
      toast.success("Student removed from batch");
    } catch (error) {
      console.error("Error removing student from batch:", error);
      toast.error("Failed to remove student from batch");
    }
  };

  const updateStudentPosition = async (userId, position) => {
    try {
      const updatedBatchStudents = batchStudents.map((student) => {
        if (student.userId === userId) {
          return { ...student, position };
        }
        return student;
      });

      setBatchStudents(updatedBatchStudents);

      // Update batch with new positions
      await batchService.updateBatch(batchId, {
        studentIds: updatedBatchStudents.map((itm) => JSON.stringify(itm)),
      });
      toast.success("Seating position updated");
    } catch (error) {
      console.error("Error updating student position:", error);
      toast.error("Failed to update seating position");
    }
  };

  const findStudentByPosition = (x, y) => {
    return batchStudents.find(
      (student) =>
        student.position && student.position.x === x && student.position.y === y
    );
  };

  const handleSeatClick = (x, y) => {
    // Check if seat is already occupied
    const existingStudent = findStudentByPosition(x, y);

    if (existingStudent) {
      // Clear this position
      updateStudentPosition(existingStudent.userId, { x: -1, y: -1 });
    } else {
      // Find unassigned students
      const unassignedStudents = batchStudents.filter(
        (student) =>
          !student.position ||
          student.position.x === -1 ||
          student.position.y === -1
      );

      if (unassignedStudents.length > 0) {
        // For simplicity, just assign the first unassigned student
        updateStudentPosition(unassignedStudents[0].userId, { x, y });
      } else {
        toast.info("No unassigned students available");
      }
    }
  };

  // Get student details from the map
  const getStudentDetails = (userId) => {
    return studentDataMap[userId] || { userName: "Unknown", studentId: "N/A" };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Batch Students Management</h1>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setClassroomView(false)}
            className={`px-4 py-2 rounded ${
              !classroomView ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setClassroomView(true)}
            className={`px-4 py-2 rounded ${
              classroomView ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Classroom View
          </button>
        </div>
      </div>

      {classroomView ? (
        <Classroom
          rows={rows}
          cols={cols}
          batchStudents={batchStudents}
          findStudentByPosition={findStudentByPosition}
          handleSeatClick={handleSeatClick}
          getStudentDetails={getStudentDetails}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Batch Students */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Batch Students</h2>
            {batchStudents.length === 0 ? (
              <p className="text-gray-500 italic">
                No students in this batch yet
              </p>
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
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold">
                            {studentDetails.userName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {studentDetails.email}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                              {batchStudent.status}
                            </span>
                            {batchStudent.position &&
                            batchStudent.position.x >= 0 ? (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Seat: Row {batchStudent.position.y + 1}, Col{" "}
                                {batchStudent.position.x + 1}
                              </span>
                            ) : (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
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
                      <div className="flex-grow">
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
      )}
    </div>
  );
};

export default Students;
