import React, { useState, useEffect, useMemo } from "react";
import { Printer } from "lucide-react";
import { pdf, PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import TraineeLeaveRecordPDF from "./TranieeLeaveRecordPDF";
import { useGetCollegeQuery } from "../../../../../store/api/collegeApi";
import { useGetTradeQuery } from "../../../../../store/api/tradeApi";
import { getMonthsArray } from "../util/util";
import { addMonths, differenceInMonths, format } from "date-fns";
import LoadingState from "../components/LoadingState";
import { useSearchParams } from "react-router-dom";

const TraineeLeaveRecord = ({ studentProfiles = [], batchData, stats }) => {
  // Early check for missing data
  if (!stats || !stats.length) {
    return (
      <div className="text-center text-gray-500 py-10">
        No students found in this batch
      </div>
    );
  }

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [leaveData, setLeaveData] = useState(null);
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

  // Process data when a student is selected
  const processStudentData = useMemo(() => {
    return (student, leaveRecords, batch) => {
      // Skip processing if any data is missing
      if (!student || !leaveRecords || !batch) return null;

      // Process attendance records
      const processAttendanceRecords = () => {
        let attendanceMap = {};

        if (leaveRecords?.monthlyAttendance) {
          Object.entries(leaveRecords.monthlyAttendance).forEach(
            ([dateStr, data]) => {
              try {
                const month = format(new Date(dateStr), "MMM yyyy");
                attendanceMap[month] = {
                  possibleDays: data.absentDays + data.presentDays,
                  presentDays: data.presentDays,
                  sickLeave: 0,
                  casualLeave: 0,
                };
              } catch (error) {
                console.error(`Error processing date: ${dateStr}`, error);
              }
            }
          );
        }

        const allMonths = getMonthsArray(
          batch.start_date,
          batch.end_date,
          "MMM yyyy"
        );

        const completeAttendance = allMonths.reduce((acc, month) => {
          acc[month] = attendanceMap[month] || {
            possibleDays: "",
            presentDays: "",
            sickLeave: "",
            casualLeave: "",
            percent: "",
          };
          return acc;
        }, {});

        const monthsPerPage = 12;
        const pages = [];

        for (let i = 0; i < allMonths.length; i += monthsPerPage) {
          const pageMonths = allMonths.slice(i, i + monthsPerPage);
          const pageData = {};

          pageMonths.forEach((month) => {
            pageData[month] = completeAttendance[month];
          });

          pages.push({
            months: pageMonths,
            data: pageData,
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

        return { pages };
      };

      const { pages } = processAttendanceRecords();

      // Ensure we're explicitly capturing the college and trade information
      const collegeInfo = college
        ? {
            collageName: college.collageName,
          }
        : {};

      const tradeInfo = trade
        ? {
            tradeName: trade.name || trade.tradeName,
          }
        : {};

      const defaultData = {
        pages,
        stipend: "Yes",
        casualLeaveRecords: [],
        medicalLeaveRecords: [],
        parentMeetings: [],
      };

      // Create a structured data object with explicit properties
      return {
        ...student,
        ...collegeInfo,
        ...tradeInfo,
        ...defaultData,
      };
    };
  }, [college, trade]);

  // Update URL when a student is selected
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
        collageName: college?.collageName,

        tradeName: trade?.tradeName,
      };

      setSelectedStudent(newSelectedStudent);
    }
  }, [studentProfiles, college, trade, searchParams, selectedStudent]);

  // Process leave data when student is selected
  useEffect(() => {
    if (!selectedStudent) return;

    const studentStats = stats.find(
      (stat) => stat.userId === selectedStudent.userId
    );

    if (!studentStats) return;

    const data = processStudentData(selectedStudent, studentStats, batchData);
    setLeaveData(data);
  }, [selectedStudent, stats, batchData, processStudentData]);

  // Generate PDF preview
  useEffect(() => {
    let currentUrl = "";

    const generatePreview = async () => {
      if (!leaveData) {
        setPdfUrl("");
        return;
      }

      try {
        const blob = await pdf(
          <TraineeLeaveRecordPDF data={leaveData} />
        ).toBlob();
        currentUrl = URL.createObjectURL(blob);
        setPdfUrl(currentUrl);
      } catch (error) {
        console.error("Error generating PDF:", error);
        setPdfUrl("");
      }
    };

    generatePreview();

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [leaveData]);

  // Display loading state
  if (collegeDataLoading || tradeDataLoading) return <LoadingState />;

  // Handle student selection
  const handleStudentSelect = (student) => {
    const newSelectedStudent = {
      ...student,
      collageName: college?.collageName,
      tradeName: trade?.tradeName,
    };

    setSelectedStudent(newSelectedStudent);
    setIsDropdownOpen(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 dark:bg-gray-900">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Student Selector Dropdown */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full sm:w-[280px] flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-xs hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
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

        {/* PDF Download Button */}
        <div className="flex gap-2 w-full sm:w-auto">
          {leaveData && (
            <PDFDownloadLink
              document={<TraineeLeaveRecordPDF data={leaveData} />}
              fileName={`leave-record-${leaveData.userName}.pdf`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {({ loading }) => (
                <>
                  <Printer className="h-4 w-4" />
                  {loading ? "Generating..." : "Download"}
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Leave Record Preview or Placeholder */}
      <div className="overflow-hidden border rounded-lg shadow-xs dark:border-gray-700 dark:bg-gray-800">
        {leaveData ? (
          pdfUrl ? (
            <PDFViewer width="100%" height="842px">
              <TraineeLeaveRecordPDF data={leaveData} />
            </PDFViewer>
          ) : (
            <div className="w-full h-[600px] sm:h-[842px] flex items-center justify-center dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                Generating preview...
              </p>
            </div>
          )
        ) : (
          <div className="w-full h-[600px] sm:h-[842px] flex items-center justify-center bg-white dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              Select a student to view their leave record
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraineeLeaveRecord;
