import React, { useState, useEffect, useMemo } from "react";
import { Edit2, Printer } from "lucide-react";
import { pdf, PDFDownloadLink } from "@react-pdf/renderer";
import ProgressCardPDF from "./ProgressCardPDF";
import { useGetCollegeQuery } from "../../../../../store/api/collegeApi";
import { useGetTradeQuery } from "../../../../../store/api/tradeApi";
import { getMonthsArray } from "../util/util";
import EditProgressCard from "./EditProgressCard";
import { addMonths, differenceInMonths, format } from "date-fns";
import LoadingState from "../components/LoadingState";
import { useSearchParams } from "react-router-dom";

const ProgressCard = ({
  studentProfiles = [],
  stats,
  batchData,
  setBatchData,
}) => {
  // Early check for missing data
  if (!stats || !stats.length) {
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
  const [pdfUrl, setPdfUrl] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  // Get college and trade data
  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    batchData.collegeId
  );
  const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
    batchData.tradeId
  );

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
      // Create a structured object with the student data
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

      // Parse batch marks data
      const batchMarksParsed = batch.batchMarks.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item
      );

      // Find student's marks
      const studentMarks = batchMarksParsed.find(
        ({ userId }) => userId === student.userId
      );

      const marks = studentMarks ? Object.fromEntries(studentMarks.marks) : {};

      // Get monthly attendance records for the student
      const monthlyRecords =
        studentStats.find((item) => item.userId === student.userId)
          ?.monthlyAttendance || {};

      // Get quarterly tests data
      const quarterlyTests = student.quarterlyTests || new Array(3).fill({});

      // Get all months in the batch duration
      const allMonths = getMonthsArray(
        batch.start_date,
        batch.end_date,
        "MMMM yyyy"
      );

      // Merge marks and attendance records
      const completeRecords = {};
      allMonths.forEach((monthKey) => {
        completeRecords[monthKey] =
          { ...marks[monthKey], ...monthlyRecords[monthKey] } || {};
      });

      // Organize data into pages
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
    if (!selectedStudent || !batchData || !stats || stats.length === 0) {
      setProgressData(null);
      return;
    }

    const data = processProgressData(selectedStudent, batchData, stats);
    setProgressData(data);
  }, [selectedStudent, batchData, stats, processProgressData]);

  // Generate PDF preview
  const generatePreview = async () => {
    if (
      !progressData ||
      !progressData.pages ||
      progressData.pages.length === 0
    ) {
      setPdfUrl("");
      return;
    }

    try {
      const blob = await pdf(<ProgressCardPDF data={progressData} />).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPdfUrl("");
    }
  };

  // Update PDF preview when progress data changes
  useEffect(() => {
    let url = "";

    if (progressData) {
      generatePreview();
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [progressData]);

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
    <div className="w-full max-w-4xl mx-auto relative dark:bg-gray-900">
      <div className="mb-4 flex-col md:flex-row justify-start items-start flex md:justify-between md:items-center gap-4">
        {/* Student Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-[280px] flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-xs hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
          >
            <span className="text-gray-700 dark:text-white">
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
        <div className="flex justify-center items-center gap-4">
          {progressData && (
            <button
              onClick={() => setEditMode((prev) => !prev)}
              className="bg-blue-600 p-2 rounded-md text-white flex items-center gap-2 px-2 py-2 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Edit2 className="h-4" /> {editMode ? "Close Edit" : "Open Edit"}
            </button>
          )}

          {progressData && (
            <PDFDownloadLink
              document={<ProgressCardPDF data={progressData} />}
              fileName={`progress-card-${progressData.userName}.pdf`}
              className="flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {({ loading }) => (
                <>
                  <Printer className="h-4" />
                  {loading ? "Generating PDF..." : "Download PDF"}
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Edit Mode or Progress Card Preview */}
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
        <div className="overflow-hidden border rounded-lg shadow-xs dark:border-gray-700 dark:bg-gray-800">
          {progressData ? (
            pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-[842px] border-0"
                title="Progress Card Preview"
              />
            ) : (
              <div className="w-full h-[842px] flex items-center justify-center dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">
                  Generating preview...
                </p>
              </div>
            )
          ) : (
            <div className="w-full h-[842px] flex items-center justify-center bg-white dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                Select a student to view their progress card
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressCard;
