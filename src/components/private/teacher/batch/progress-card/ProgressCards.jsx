import React, { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { pdf, PDFDownloadLink } from "@react-pdf/renderer";
import ProgressCardPDF from "./ProgressCardPDF";
import { useGetCollegeQuery } from "../../../../../store/api/collegeApi";
import { useGetTradeQuery } from "../../../../../store/api/tradeApi";
import { getMonthsArray } from "../util/util";

import EditProgressCard from "./EditProgressCard";
import { addMonths, differenceInMonths, format } from "date-fns";

const ProgressCard = ({
  studentProfiles = [],
  stats,
  batchData,
  setBatchData,
}) => {
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

  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    batchData.collegeId
  );
  const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
    batchData.tradeId
  );

  useEffect(() => {
    if (!selectedStudent || !batchData || stats.length === 0) {
      setProgressData(null);
      return;
    }

    const batchMarksParsed = batchData.batchMarks.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item
    );

    const studentMarks = batchMarksParsed.find(({ marks, userId }) => {
      return userId === selectedStudent.userId;
    });

    const marks = studentMarks ? Object.fromEntries(studentMarks.marks) : {};

    const monthlyRecords =
      stats.find((item) => item.userId === selectedStudent.userId)
        ?.monthlyAttendance || {};

    const quarterlyTests =
      selectedStudent.quarterlyTests || new Array(3).fill({});

    const allMonths = getMonthsArray(
      batchData.start_date,
      batchData.end_date,
      "MMMM yyyy"
    );

    const completeRecords = {};

    allMonths.forEach((monthKey) => {
      completeRecords[monthKey] =
        { ...marks[monthKey], ...monthlyRecords[monthKey] } || {};
    });

    const monthlyRecordArray = Object.entries(completeRecords);
    // Create pages with max 12 months per page
    let pages = [];
    const monthsPerPage = 12;

    // Create pages with chunks of data
    for (let i = 0; i < monthlyRecordArray.length; i += monthsPerPage) {
      pages.push({
        data: monthlyRecordArray.slice(i, i + monthsPerPage),
        yearRange: `${format(
          addMonths(new Date(batchData.start_date), i),
          "MMMM yyyy"
        )} to ${format(
          addMonths(
            new Date(batchData.start_date),
            Math.min(
              i + 11,
              differenceInMonths(
                new Date(batchData.end_date),
                new Date(batchData.start_date)
              )
            )
          ),
          "MMMM yyyy"
        )}`,
      });
    }

    setProgressData({ ...selectedStudent, quarterlyTests, pages });
  }, [selectedStudent, batchData, stats]);

  const generatePreview = async () => {
    // Only generate if we have valid progressData
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

  useEffect(() => {
    if (progressData) {
      generatePreview();
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [progressData]);

  if (collegeDataLoading || tradeDataLoading) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto relative  ">
      <div className="mb-4 flex-col md:flex-row justify-start items-start flex md:justify-between md:items-center gap-4 ">
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

        {progressData && (
          <button
            onClick={() => setEditMode((prev) => !prev)}
            className="bg-blue-600 p-2 rounded-md text-white"
          >
            {editMode ? "Close Edit" : "Open Edit"}
          </button>
        )}

        {progressData && (
          <PDFDownloadLink
            document={<ProgressCardPDF data={progressData} />}
            fileName={`progress-card-${progressData.userName}.pdf`}
            className="flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

      {editMode ? (
        <div className="w-full h-full  rounded-md">
          <EditProgressCard
            progressData={progressData}
            setProgressdata={setProgressData}
            setEditMode={setEditMode}
            batchData={batchData}
            setBatchData={setBatchData}
          />
        </div>
      ) : (
        <div className="overflow-hidden border rounded-lg shadow-sm">
          {progressData ? (
            pdfUrl ? (
              <>
                <iframe
                  src={pdfUrl}
                  className="w-full h-[842px] border-0"
                  title="Progress Card Preview"
                />
              </>
            ) : (
              <div className="w-full h-[842px] flex items-center justify-center">
                <p className="text-gray-500">Generating preview...</p>
              </div>
            )
          ) : (
            <div className="w-full h-[842px] flex items-center justify-center bg-white">
              <p className="text-gray-500">
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
