import React, { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { pdf, PDFDownloadLink } from "@react-pdf/renderer";
import ProgressCardPDF from "./ProgressCardPDF";
import { useGetCollegeQuery } from "../../../../store/api/collegeApi";
import { useGetTradeQuery } from "../../../../store/api/tradeApi";

const ProgressCard = ({ studentProfiles = [], stats, batchData }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    batchData.collegeId
  );
  const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
    batchData.tradeId
  );

  const generatePreview = async () => {
    if (!selectedStudent) {
      setPdfUrl("");
      return;
    }
    try {
      const blob = await pdf(
        <ProgressCardPDF
          batch={batchData}
          student={selectedStudent}
          monthlyRecords={
            stats.find((item) => item.userId === selectedStudent.userId)
              ?.monthlyAttendance || {}
          }
          quarterlyTests={
            selectedStudent.quarterlyTests || new Array(3).fill({})
          }
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPdfUrl("");
    }
  };

  useEffect(() => {
    generatePreview();
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [selectedStudent, stats]);

  if (collegeDataLoading || tradeDataLoading) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto  ">
      <div className="mb-4 flex justify-between items-center ">
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

        {selectedStudent && (
          <div className="flex flex-row gap-5">
            <PDFDownloadLink
              document={
                <ProgressCardPDF
                  batch={batchData}
                  student={selectedStudent}
                  monthlyRecords={
                    stats.find((item) => item.userId === selectedStudent.userId)
                      ?.monthlyAttendance || {}
                  }
                  quarterlyTests={selectedStudent.quarterlyTests || []}
                />
              }
              fileName={`progress-card-${selectedStudent.userName}.pdf`}
              className="flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {({ loading }) => (
                <>
                  <Printer className="h-4 w-4" />
                  {loading ? "Generating PDF..." : "Download PDF"}
                </>
              )}
            </PDFDownloadLink>
            <button
              onClick={() => window.open(pdfUrl, "_blank")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Open PDF in new tab
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden border rounded-lg shadow-sm">
        {selectedStudent ? (
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
    </div>
  );
};

export default ProgressCard;
