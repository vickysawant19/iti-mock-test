import React, { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { pdf, PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";

import TraineeLeaveRecordPDF from "./TranieeLeaveRecordPDF";
import { useGetCollegeQuery } from "../../../../../store/api/collegeApi";
import { useGetTradeQuery } from "../../../../../store/api/tradeApi";

const TraineeLeaveRecord = ({ studentProfiles = [], batchData, stats }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    batchData.collegeId
  );
  const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
    batchData.tradeId
  );

  useEffect(() => {
    let currentUrl = "";
    const generatePreview = async () => {
      if (!selectedStudent) {
        setPdfUrl("");
        return;
      }
      try {
        const blob = await pdf(
          <TraineeLeaveRecordPDF
            batch={batchData}
            student={selectedStudent}
            leaveRecords={stats.find(
              (i) => i.userId === selectedStudent.userId
            )}
          />
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
  }, [selectedStudent]);

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
          {selectedStudent && (
            <PDFDownloadLink
              document={
                <TraineeLeaveRecordPDF
                  batch={batchData}
                  student={selectedStudent}
                  leaveRecords={stats.find(
                    (i) => i.userId === selectedStudent.userId
                  )}
                />
              }
              fileName={`leave-record-${selectedStudent.userName}.pdf`}
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
        {selectedStudent ? (
          pdfUrl ? (
            <PDFViewer width="100%" height="842px">
              <TraineeLeaveRecordPDF
                batch={batchData}
                student={selectedStudent}
                leaveRecords={stats.find(
                  (i) => i.userId === selectedStudent.userId
                )}
              />
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
