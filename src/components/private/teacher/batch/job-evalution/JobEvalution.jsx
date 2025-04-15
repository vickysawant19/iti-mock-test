import React, { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { Query } from "appwrite";
import { ClipLoader } from "react-spinners";
import { pdf, PDFDownloadLink } from "@react-pdf/renderer";
import { format, max, min, parseISO } from "date-fns";

import JobEvaluationReportPDF from "./JobEvalutionPDF";
import { useGetCollegeQuery } from "../../../../../store/api/collegeApi";
import { useGetTradeQuery } from "../../../../../store/api/tradeApi";
import moduleServices from "../../../../../appwrite/moduleServices";
import useScrollToItem from "../../../../../utils/useScrollToItem";

const JobEvaluation = ({ studentProfiles = [], batchData, attendance }) => {
  if (!studentProfiles.length) {
    return (
      <div className="text-center text-gray-500 py-10">
        No students found in this batch
      </div>
    );
  }
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [modules, setModules] = useState(null);

  const [selectedYear, setSelectedYear] = useState("FIRST");
  const [selectedModule, setSelectedModule] = useState(null);

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const [studentsMap, setStudentsMap] = useState(new Map());
  const [studentAttendance, setStudentAttendance] = useState({});

  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    batchData.collegeId
  );
  // const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
  //   batchData.tradeId
  // );

  const { scrollToItem, itemRefs } = useScrollToItem(
    modules?.syllabus || [],
    "moduleId"
  );

  useEffect(() => {
    if (!attendance || attendance.length === 0) return;
    const dateKeysAttendance = attendance.reduce((acc, doc) => {
      acc[doc.userId] = doc.attendanceRecords.reduce((a, d) => {
        a[d.date] = !a[d.date] ? d.attendanceStatus : a[d.date];
        return a;
      }, {});

      return acc;
    }, {});

    setStudentAttendance(dateKeysAttendance);
  }, [attendance]);

  useEffect(() => {
    if (selectedModule && isModuleDropdownOpen) {
      scrollToItem(selectedModule.moduleId);
    }
  }, [isModuleDropdownOpen]);

  useEffect(() => {
    if (studentProfiles) {
      setStudentsMap(
        new Map(studentProfiles.map((item) => [+item.studentId, item]))
      );
    }
  }, [studentProfiles]);

  const generatePreview = async () => {
    if (!selectedModule) {
      setPdfUrl("");
      return;
    }
    try {
      const blob = await pdf(
        <JobEvaluationReportPDF
          college={college}
          studentsMap={studentsMap}
          selectedModule={selectedModule}
          studentAttendance={studentAttendance}
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

      const practicalDates = Array.isArray(batchData?.dailyDairy) // Ensure dailyDairyd is an array
        ? batchData.dailyDairy
            .map((item) => {
              try {
                const parsedItem = JSON.parse(item);
                if (!Array.isArray(parsedItem) || parsedItem.length < 2) {
                  console.warn("Invalid parsed item format:", parsedItem);
                  return null;
                }
                return parsedItem;
              } catch (error) {
                console.error("JSON parsing error:", error);
                return null;
              }
            })
            .filter(Boolean) // Remove null values (invalid entries)
            .reduce((acc, [date, practical]) => {
              if (!date || typeof date !== "string") {
                console.warn("Invalid date format:", date);
                return acc;
              }

              if (!practical || typeof practical !== "object") {
                console.warn("Invalid practical data:", practical);
                return acc;
              }

              if (!practical.practicalNumber) return acc;

              acc[practical.practicalNumber] = acc[practical.practicalNumber]
                ? [...acc[practical.practicalNumber], date]
                : [date];

              return acc;
            }, {})
        : {}; // Ensure practicalDates is an object even if dailyDairyd is missing

      const newSyllabus = data?.syllabus?.map((item) => {
        const moduleIdNumber = +item.moduleId.match(/\d+/)?.[0];
        const rawDates = practicalDates[moduleIdNumber] || [];

        // Validate and parse dates
        const dateObjects = rawDates
          .map((date) => (date ? parseISO(date) : null))
          .filter((date) => date instanceof Date && !isNaN(date));

        // Ensure valid min/max dates
        const minDate = dateObjects.length
          ? format(min(dateObjects), "yyyy-MM-dd")
          : null;
        const maxDate = dateObjects.length
          ? format(max(dateObjects), "yyyy-MM-dd")
          : null;

        return {
          ...item,
          startDate: minDate,
          endDate: maxDate,
        };
      });

      setModules({ ...data, syllabus: newSyllabus ? newSyllabus : [] });
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [selectedYear, batchData.tradeId]);

  if (isLoading || collegeDataLoading ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 text-sm">
      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md shadow-sm mb-4">
        <ul className="list-disc ml-6 space-y-2">
          <li>Add students attendance to ensure accurate evaluations.</li>
          <li>
            Include daily diary entries with Practical Number to support a
            correct job evaluation report.
          </li>
        </ul>
      </div>

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
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer`}
                  onClick={() => {
                    setIsYearDropdownOpen(false);
                    setSelectedYear(year);
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

          <div
            className={`${
              isModuleDropdownOpen ? "block" : "hidden"
            } absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto`}
          >
            {modules &&
              modules?.syllabus.map((module) => (
                <div
                  ref={(el) => (itemRefs.current[module.moduleId] = el)}
                  key={module.moduleId}
                  className={`${
                    selectedModule?.moduleId === module?.moduleId
                      ? "bg-gray-200"
                      : "bg-white"
                  }  px-4 py-2 hover:bg-gray-100 cursor-pointer`}
                  onClick={() => {
                    setSelectedModule(module);
                    setIsModuleDropdownOpen(false);
                  }}
                >
                  {module.moduleId.slice(1)}.{module.moduleName}
                </div>
              ))}
          </div>
        </div>
      </div>

      {Array.isArray(modules?.syllabus) &&
        modules.syllabus.length > 0 &&
        selectedModule && (
          <PDFDownloadLink
            document={
              <JobEvaluationReportPDF
                college={college}
                studentsMap={studentsMap}
                selectedModule={selectedModule}
                studentAttendance={studentAttendance}
              />
            }
            fileName={`job-evaluation-${selectedModule?.moduleName
              .slice(0, 40)
              .split(" ")
              .join("-")}.pdf`}
            className="w-64 flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {({ loading }) => (
              <>
                <Printer className="h-4  min-w-16" />
                {loading ? "Generating PDF" : "Download PDF"}
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
