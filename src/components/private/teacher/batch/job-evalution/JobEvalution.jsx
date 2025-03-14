import React, { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { pdf, PDFDownloadLink } from "@react-pdf/renderer";
import JobEvaluationReportPDF from "./JobEvalutionPDF";
import { useGetCollegeQuery } from "../../../../../store/api/collegeApi";
import { useGetTradeQuery } from "../../../../../store/api/tradeApi";
import moduleServices from "../../../../../appwrite/moduleServices";
import { Query } from "appwrite";

const JobEvaluation = ({ studentProfiles = [], batchData }) => {
  const [pdfUrl, setPdfUrl] = useState("");
  const [modules, setModules] = useState([]);

  const [selectedYear, setSelectedYear] = useState("FIRST");
  const [selectedModule, setSelectedModule] = useState(null);

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const [studentsMap, setStudentsMap] = useState(new Map());

  useEffect(() => {
    if (studentProfiles) {
      setStudentsMap(
        new Map(studentProfiles.map((item) => [+item.studentId, item]))
      );
    }
  }, [studentProfiles]);

  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    batchData.collegeId
  );
  const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
    batchData.tradeId
  );

  const generatePreview = async () => {
    if (!selectedModule) {
      setPdfUrl("");
      return;
    }
    try {
      const blob = await pdf(
        <JobEvaluationReportPDF
          college={college}
          trade={trade}
          batch={batchData}
          studentsMap={studentsMap}
          selectedModule={selectedModule}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPdfUrl("");
    }
  };

  // Generate/re-generate PDF preview when selected student or module changes
  useEffect(() => {
    generatePreview();
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [selectedModule]);

  // Fetch modules based on selected subject and year
  const fetchModules = async () => {
    try {
      if (!selectedYear) return;
      const data = await moduleServices.listModules([
        Query.equal("tradeId", batchData.tradeId),
        Query.contains("subjectName", "PRACTICAL"),
        Query.equal("year", selectedYear),
      ]);

      setModules(data);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [selectedYear, batchData.tradeId]);

  if (collegeDataLoading || tradeDataLoading) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Dropdowns for Subject, Year, Module, and Student */}
      <div className="mb-4 flex flex-col gap-4">
        {/* Year Dropdown */}
        <div className="relative">
          <h1>Select Year:</h1>
          <button
            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            className="w-[150px] flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <span className="text-gray-700">{selectedYear}</span>
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
          {isYearDropdownOpen && (
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
              {["FIRST", "SECOND"].map((year) => (
                <div
                  key={year}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedYear(year);
                    setIsYearDropdownOpen(false);
                    setSelectedModule(null);
                  }}
                >
                  {year}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module Dropdown */}
        <div className="relative">
          <h1>Select Job:</h1>
          <button
            onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
            className=" flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <span className="text-gray-700">
              {selectedModule
                ? selectedModule.moduleId.slice(1) +
                  "-" +
                  selectedModule.moduleName
                : "Select Module"}
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
          {isModuleDropdownOpen && (
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {modules &&
                modules?.syllabus.map((module) => (
                  <div
                    key={module.moduleId}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSelectedModule(module);
                      setIsModuleDropdownOpen(false);
                    }}
                  >
                    {module.moduleId.slice(1)}.{module.moduleName}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {selectedModule && (
        <PDFDownloadLink
          document={
            <JobEvaluationReportPDF
              college={college}
              trade={trade}
              batch={batchData}
              studentsMap={studentsMap}
              selectedModule={selectedModule}
            />
          }
          fileName={`job-evaluation-${selectedModule.moduleName
            .split(" ")
            .join("-")}.pdf`}
          className="w-64 flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {({ loading }) => (
            <>
              <Printer className="h-4" />
              {loading ? "Generating PDF..." : "Download PDF"}
            </>
          )}
        </PDFDownloadLink>
      )}

      <div className="overflow-hidden border rounded-lg shadow-sm mt-4">
        {selectedModule ? (
          pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[842px] border-0"
              title="Job Evaluation Report Preview"
            />
          ) : (
            <div className="w-full h-[842px] flex items-center justify-center">
              <p className="text-gray-500">Generating preview...</p>
            </div>
          )
        ) : (
          <div className="w-full h-[842px] flex items-center justify-center bg-white">
            <p className="text-gray-500">
              Select a student to view their job evaluation report
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobEvaluation;
