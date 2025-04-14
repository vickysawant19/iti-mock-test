import React, { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { pdf, PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";

import TraineeLeaveRecordPDF from "./TranieeLeaveRecordPDF";
import { useGetCollegeQuery } from "../../../../../store/api/collegeApi";
import { useGetTradeQuery } from "../../../../../store/api/tradeApi";
import { getMonthsArray } from "../util/util";
import { addMonths, differenceInMonths, format } from "date-fns";

const TraineeLeaveRecord = ({ studentProfiles = [], batchData, stats }) => {
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

  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    batchData.collegeId
  );
  const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
    batchData.tradeId
  );

  useEffect(() => {
    if (!selectedStudent) return;

    const processAttendanceRecords = (leaveRecords, batch) => {
      // Convert monthly attendance into a structured format
      let attendanceMap = {};

      if (leaveRecords?.monthlyAttendance) {
        Object.entries(leaveRecords.monthlyAttendance).forEach(
          ([dateStr, data]) => {
            try {
              // Format the month key
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

      // Get all months from batch start to end date
      const allMonths = getMonthsArray(
        batch.start_date,
        batch.end_date,
        "MMM yyyy"
      );

      // Create complete attendance object with all months (including empty ones)
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

      // Create pages with 12 months per page
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

      return {
        pages,
      };
    };

    // Usage example
    const processStudentData = (student, leaveRecords, batch) => {
      // Get attendance data and pages
      const { pages } = processAttendanceRecords(leaveRecords, batch);

      // Create default data structure
      const defaultData = {
        pages: pages,
        stipend: "Yes",
        casualLeaveRecords: [],
        medicalLeaveRecords: [],
        parentMeetings: [],
      };

      // Merge with provided data or use defaults
      return { ...student, ...defaultData };
    };

    const studentStats = stats.find(
      (stat) => stat.userId === selectedStudent.userId
    );

    const data = processStudentData(selectedStudent, studentStats, batchData);
    setLeaveData(data);
  }, [selectedStudent, stats, batchData]);

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
  }, [selectedStudent, leaveData]);

  if (collegeDataLoading || tradeDataLoading) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-[280px] flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <span className="text-gray-700">
              {selectedStudent ? selectedStudent.userName : "Select student"}
            </span>
            <svg
              className="w-4 h-4 text-gray-500"
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
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {studentProfiles.map((student) => (
                <div
                  key={student.userId}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedStudent({ ...student, ...college, ...trade });
                    setIsDropdownOpen(false);
                  }}
                >
                  {student.userName}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {leaveData && (
            <PDFDownloadLink
              document={<TraineeLeaveRecordPDF data={leaveData} />}
              fileName={`leave-record-${leaveData.userName}.pdf`}
              className="flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {({ loading }) => (
                <>
                  <Printer className="h-4 w-4" />
                  {loading ? "Generating PDF..." : "Download PDF"}
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      <div className="overflow-hidden border rounded-lg shadow-sm">
        {leaveData ? (
          pdfUrl ? (
            <PDFViewer width="100%" height="842px">
              <TraineeLeaveRecordPDF data={leaveData} />
            </PDFViewer>
          ) : (
            <div className="w-full h-[842px] flex items-center justify-center">
              <p className="text-gray-500">Generating preview...</p>
            </div>
          )
        ) : (
          <div className="w-full h-[842px] flex items-center justify-center bg-white">
            <p className="text-gray-500">
              Select a student to view their leave record
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraineeLeaveRecord;
