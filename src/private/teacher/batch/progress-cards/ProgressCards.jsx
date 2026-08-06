import React, { useState, useEffect, useMemo, useRef } from "react";
import { Edit2, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import ProgressCardPrint from "./ProgressCardPrint";
import { useGetCollegeQuery } from "@/store/api/collegeApi";
import { useGetTradeQuery } from "@/store/api/tradeApi";
import { getMonthsArray } from "../util/util";
import EditProgressCard from "./EditProgressCard";
import { addMonths, differenceInMonths, format } from "date-fns";
import LoadingState from "../components/LoadingState";
import { useSearchParams } from "react-router-dom";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import { calculateStats } from "@/private/Attendance/CalculateStats";
import { Query } from "appwrite";

const ProgressCard = ({
  studentProfiles = [],
  batchData,
  setBatchData,
}) => {
  // Early check for missing data
  if (!studentProfiles || !studentProfiles.length) {
    return (
      <div className="text-center text-gray-500 py-10">
        No students found in this batch
      </div>
    );
  }

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // ref for the printable area
  const printRef = useRef(null);

  // Get college and trade data
  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    batchData.collegeId
  );
  const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
    batchData.tradeId
  );

  // react-to-print hook
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `progress-card-${progressData?.userName || "student"}`,
  });

  // Update search params when a student is selected
  useEffect(() => {
    if (selectedStudent) {
      setSearchParams((prevData) => {
        const data = Object.fromEntries(prevData);
        return { ...data, userId: selectedStudent.userId };
      });
    }
  }, [selectedStudent, setSearchParams]);

  // Handle student selection from URL
  useEffect(() => {
    if (selectedStudent) return;

    const userIdFromUrl = searchParams.get("userId");
    if (!userIdFromUrl || !studentProfiles.length || !college || !trade) return;

    const foundStudent = studentProfiles.find(
      (student) => student.userId === userIdFromUrl
    );

    if (
      foundStudent &&
      (!selectedStudent || selectedStudent.userId !== userIdFromUrl)
    ) {
      const newSelectedStudent = {
        ...foundStudent,
        collageName: college.collageName,
        tradeName: trade.tradeName,
      };
      setSelectedStudent(newSelectedStudent);
    }
  }, [studentProfiles, college, trade, searchParams, selectedStudent]);

  // Process progress data for selected student
  const processProgressData = useMemo(() => {
    return (student, batch, studentStats) => {
      if (!student || !batch || !studentStats.length) return null;

      const batchMarksParsed = (batch.batchMarks || []).map((item) =>
        typeof item === "string" ? JSON.parse(item) : item
      );

      const studentMarks = batchMarksParsed.find(
        ({ userId }) => userId === student.userId
      );

      const marks = studentMarks ? Object.fromEntries(studentMarks.marks) : {};

      const monthlyRecords =
        studentStats.find((item) => item.userId === student.userId)
          ?.monthlyAttendance || {};

      const quarterlyTests = student.quarterlyTests || new Array(3).fill({});

      const allMonths = getMonthsArray(
        batch.start_date,
        batch.end_date,
        "MMMM yyyy"
      );

      const completeRecords = {};
      allMonths.forEach((monthKey) => {
        completeRecords[monthKey] =
          { ...marks[monthKey], ...monthlyRecords[monthKey] } || {};
      });

      const monthlyRecordArray = Object.entries(completeRecords);
      let pages = [];
      const monthsPerPage = 12;

      for (let i = 0; i < monthlyRecordArray.length; i += monthsPerPage) {
        pages.push({
          data: monthlyRecordArray.slice(i, i + monthsPerPage),
          yearRange: `${format(
            addMonths(new Date(batch.start_date), i),
            "MMMM yyyy"
          )} to ${format(
            addMonths(
              new Date(batch.start_date),
              Math.min(
                i + 11,
                differenceInMonths(
                  new Date(batch.end_date),
                  new Date(batch.start_date)
                )
              )
            ),
            "MMMM yyyy"
          )}`,
        });
      }

      return { ...student, quarterlyTests, pages };
    };
  }, []);

  // Update progress data when selected student changes
  useEffect(() => {
    const fetchAndProcessData = async () => {
      if (!selectedStudent || !batchData) {
        setProgressData(null);
        return;
      }
      
      setIsFetchingStats(true);
      try {
        const attendanceRecords = await newAttendanceService.getStudentAttendance(
          selectedStudent.userId,
          batchData.$id,
          [Query.select(["date", "status"])]
        );
        
        const studentStat = calculateStats({
          userId: selectedStudent.userId,
          studentId: selectedStudent.studentId,
          userName: selectedStudent.userName,
          data: attendanceRecords,
        });

        const data = processProgressData(selectedStudent, batchData, [studentStat]);
        setProgressData(data);
      } catch (error) {
        console.error("Error fetching progress stats:", error);
      } finally {
        setIsFetchingStats(false);
      }
    };
    
    fetchAndProcessData();
  }, [selectedStudent, batchData, processProgressData]);

  // Handle student selection
  const handleStudentSelect = (student) => {
    if (!college || !trade) return;

    const newSelectedStudent = {
      ...student,
      collageName: college.collageName,
      tradeName: trade.tradeName,
    };

    setSelectedStudent(newSelectedStudent);
    setIsDropdownOpen(false);
  };

  // Display loading state
  if (collegeDataLoading || tradeDataLoading) return <LoadingState />;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 dark:bg-gray-900 bg-gray-50 min-h-screen">
      
      {/* Left Sidebar */}
      <div className="w-full lg:w-80 shrink-0 flex  flex-col gap-6">
        {/* Student Selector Dropdown */}
        <div className="relative w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Student
          </label>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-xs hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
          >
            <span className="text-gray-700 dark:text-white truncate">
              {selectedStudent ? selectedStudent.userName : "Select student"}
            </span>
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700 dark:text-white">
              {studentProfiles.map((student) => (
                <div
                  key={student.userId}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-700 dark:text-white"
                  onClick={() => handleStudentSelect(student)}
                >
                  {student.userName}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          {progressData && (
            <button
              onClick={() => setEditMode((prev) => !prev)}
              className="w-full bg-white border border-blue-600 text-blue-600 p-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors dark:bg-gray-800 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-gray-700"
            >
              <Edit2 className="h-4 w-4" />{" "}
              {editMode ? "Close Edit" : "Edit Progress Data"}
            </button>
          )}

          {progressData && !editMode && (
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Printer className="h-5 w-5" />
              Print / Save PDF
            </button>
          )}
        </div>
      </div>

      {/* Right Side: Edit Mode or Progress Card Preview */}
      <div className="w-full lg:flex-1 min-w-0">
        {editMode ? (
          <div className="w-full h-full rounded-md dark:bg-gray-800">
            <EditProgressCard
              progressData={progressData}
              setProgressdata={setProgressData}
              setEditMode={setEditMode}
              batchData={batchData}
              setBatchData={setBatchData}
            />
          </div>
        ) : (
          <div className="overflow-auto border rounded-lg shadow-xs dark:border-gray-700 dark:bg-gray-800 bg-white">
            {progressData ? (
              /* Live preview — instant, no blob generation */
              <ProgressCardPrint ref={printRef} data={progressData} />
            ) : (
              <div className="w-full h-[600px] sm:h-[842px] flex items-center justify-center bg-white dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">
                  Select a student to view their progress card
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressCard;
