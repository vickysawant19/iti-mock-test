import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Query } from "appwrite";

import { selectProfile } from "../../../../store/profileSlice";
import userProfileService from "../../../../appwrite/userProfileService";
import batchService from "../../../../appwrite/batchService";
import ViewProfiles from "./ViewProfiles";
import { ClipLoader } from "react-spinners";

import attendanceService from "../../../../appwrite/attaindanceService";
import { calculateStats } from "../attaindance/CalculateStats";
import ViewAttendance from "./ViewAttendance";
import { ClipboardListIcon, UsersIcon } from "lucide-react";
import ProgressCard from "./progressCard";

const ViewBatch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [studentsLoading, setStudentLoading] = useState(false);
  const [attendaceLoading, setAttendaceLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [teacherBatches, setTeacherBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [view, setView] = useState(new Set().add("profiles"));

  const profile = useSelector(selectProfile);

  const fetchTeacherBatches = async () => {
    setIsLoading(true);
    try {
      const data = await batchService.listBatches([
        Query.equal("teacherId", profile.userId),
      ]);
      setTeacherBatches(
        Array.isArray(data.documents) ? data.documents : [data.documents]
      );
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatchStudent = async () => {
    setStudentLoading(true);
    try {
      const data = await userProfileService.getBatchUserProfile([
        Query.equal("batchId", selectedBatch),
      ]);
      data.sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId));
      setStudents(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error("Error fetching batch students:", error);
    } finally {
      setStudentLoading(false);
    }
  };

  const fetchStudentsAttendance = async () => {
    setAttendaceLoading(true);
    try {
      const data = await attendanceService.getBatchAttendance(selectedBatch);
      const studentsWithStudentIds = data.map((attendance) => {
        const student = students.find(
          (student) => student.userId === attendance.userId
        );
        return {
          ...attendance,
          studentId: student ? student.studentId : null,
        };
      });

      setStudentAttendance(
        Array.isArray(studentsWithStudentIds)
          ? studentsWithStudentIds
          : [studentsWithStudentIds]
      );
      setAttendanceStats(
        studentsWithStudentIds
          .sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId))
          .map((item) => calculateStats({ data: item }))
      );
    } catch (error) {
      console.error("Error fetching batch attendance:", error);
    } finally {
      setAttendaceLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch !== "") {
      fetchBatchStudent();
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (
      view.has("attendance") &&
      selectedBatch !== "" &&
      studentAttendance.length === 0
    ) {
      fetchStudentsAttendance();
    }
  }, [view, selectedBatch, studentAttendance.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 ">
      {/* Batch Selection Header */}
      <div className="mb-8 flex justify-end">
        <select
          className="p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          <option value="">Select Batch</option>
          {teacherBatches.map((item) => (
            <option key={item.$id} value={item.$id}>
              {item.BatchName}
            </option>
          ))}
        </select>
      </div>

      {/* View Toggle Buttons */}
      {selectedBatch && (
        <div className="flex justify-center gap-4 mb-8">
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              view.has("profiles")
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
            onClick={() => setView(new Set().add("profiles"))}
          >
            <UsersIcon className="w-5 h-5" />
            Student Profiles
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              view.has("attendance")
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
            onClick={() => setView(new Set().add("attendance"))}
          >
            <ClipboardListIcon className="w-5 h-5" />
            Attendance Records
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              view.has("progress-card")
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
            onClick={() => setView(new Set().add("progress-card"))}
          >
            <ClipboardListIcon className="w-5 h-5" />
            Progress Card
          </button>
        </div>
      )}

      {/* Content Section */}
      <div className="">
        {!studentsLoading && students.length > 0 && !attendaceLoading ? (
          view.has("profiles") ? (
            <ViewProfiles students={students} />
          ) : view.has("attendance") ? (
            <ViewAttendance
              students={students}
              stats={attendanceStats}
              isLoading={attendaceLoading}
            />
          ) : (
            <ProgressCard studentProfiles={students} stats={attendanceStats} />
          )
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <ClipLoader
              size={40}
              color="#2563eb"
              loading={studentsLoading || attendaceLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewBatch;
