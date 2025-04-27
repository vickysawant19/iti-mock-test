import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../../../store/profileSlice";
import { AiOutlineUserAdd, AiOutlineClose } from "react-icons/ai";
import { toast } from "react-toastify";
import batchService from "../../../../../appwrite/batchService";
import userProfileService from "../../../../../appwrite/userProfileService";
import { Query } from "appwrite";
import Classroom from "./Classroom"; // Import the new Classroom component
import ListView from "./ListView";

const Students = ({ selectedBatchData, setSelectedBatchData }) => {
  const [studentsData, setStudentsData] = useState([]);
  const [students, setStudents] = useState([]);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classroomView, setClassroomView] = useState(false);

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
        const students = await userProfileService.getBatchUserProfile([
          Query.equal("batchId", selectedBatchData.$id),
          Query.notEqual("batchId", [""]),
          Query.orderAsc("studentId"),
        ]);

        const allStudents = students.sort(
          (a, b) => parseInt(a.studentId) - parseInt(b.studentId)
        );

        setStudentsData(allStudents);

        let batchStudentsParsed = [];

        // Parse student IDs from the batch
        selectedBatchData.studentIds.forEach((itm) => {
          try {
            const data = JSON.parse(itm);
            batchStudentsParsed.push(data);
          } catch (error) {}
        });

        // Create a map for O(1) lookups by studentId
        const studentMap = new Map(
          batchStudentsParsed.map((student) => [student.userId, student])
        );

        // Reorder batchStudentsParsed to match allStudents' order
        const orderedBatchStudents = allStudents
          .map((student) => studentMap.get(student.userId)) // Get matching student from the map
          .filter(Boolean); // Remove undefined entries (if any)

        setBatchStudents(orderedBatchStudents);

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
  }, [selectedBatchData.$id]);

  const addStudentToBatch = async (student) => {
    try {
      // Add student to batch with default position (0,0)
      const newBatchStudent = {
        studentId: student.stduentId,
        userId: student.userId,
        status: "Active",
        position: { x: 0, y: 0 },
      };

      const updatedBatchStudents = [...batchStudents, newBatchStudent];
      setBatchStudents(updatedBatchStudents);

      // Remove from pending students list
      setStudents(students.filter((s) => s.userId !== student.userId));

      // Update batch with new student list
      const updatedBatchData = await batchService.updateBatch(
        selectedBatchData.$id,
        {
          studentIds: updatedBatchStudents.map((itm) => JSON.stringify(itm)),
        }
      );
      console.log("updating batch data students");
      setSelectedBatchData(updatedBatchData);
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
      const updatedBatchData = await batchService.updateBatch(
        selectedBatchData.$id,
        {
          studentIds: updatedBatchStudents.map((itm) => JSON.stringify(itm)),
        }
      );

      setSelectedBatchData(updatedBatchData);
      toast.success("Student removed from batch");
    } catch (error) {
      console.error("Error removing student from batch:", error);
      toast.error("Failed to remove student from batch");
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
    <div className="container mx-auto p-4 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
          Batch Students Management
        </h1>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setClassroomView(false)}
            className={`px-4 py-2 rounded ${
              !classroomView
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setClassroomView(true)}
            className={`px-4 py-2 rounded ${
              classroomView
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Classroom View
          </button>
        </div>
      </div>

      {classroomView ? (
        <Classroom
          batchId={selectedBatchData.$id}
          batchStudents={batchStudents}
          setBatchStudents={setBatchStudents}
          studentDataMap={studentDataMap}
          getStudentDetails={getStudentDetails}
        />
      ) : (
        <ListView
          batchStudents={batchStudents}
          getStudentDetails={getStudentDetails}
          removeStudentFromBatch={removeStudentFromBatch}
          addStudentToBatch={addStudentToBatch}
          students={students}
        />
      )}
    </div>
  );
};

export default Students;
