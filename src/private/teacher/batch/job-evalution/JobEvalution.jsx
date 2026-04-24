import React, { useState, useEffect, useRef } from "react";
import { Printer } from "lucide-react";
import { Query } from "appwrite";
import { ClipLoader } from "react-spinners";
import { useReactToPrint } from "react-to-print";
import { format, max, min, parseISO } from "date-fns";

import JobEvaluationPrintDynamic from "./JobEvaluationPrintDynamic";
import { jobEvaluationDataAdapter } from "./jobEvaluationDataAdapter";
import { useGetCollegeQuery } from "@/store/api/collegeApi";
import { useGetTradeQuery } from "@/store/api/tradeApi";
import moduleServices from "@/appwrite/moduleServices";
import useScrollToItem from "@/hooks/useScrollToItem";
import Loader from "@/components/components/Loader";
import subjectService from "@/appwrite/subjectService";
import dailyDiaryService from "@/appwrite/dailyDiaryService";
import { newAttendanceService } from "@/appwrite/newAttendanceService";

const JobEvaluation = ({ studentProfiles = [], batchData }) => {
  if (!studentProfiles.length) {
    return (
      <div className="text-center text-gray-500 py-10">
        No students found in this batch
      </div>
    );
  }

  const [isLoading, setIsLoading] = useState(false);
  const printRef = useRef(null);
  const [modules, setModules] = useState(null);

  const [selectedYear, setSelectedYear] = useState("FIRST");
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedModuleWithDates, setSelectedModuleWithDates] = useState(null);

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const [studentsMap, setStudentsMap] = useState(new Map());
  const [studentAttendance, setStudentAttendance] = useState({});

  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    batchData.collegeId,
  );

  const { scrollToItem, itemRefs } = useScrollToItem(modules || [], "moduleId");

  // Removed global attendance prop dependency

  useEffect(() => {
    if (selectedModule && isModuleDropdownOpen) {
      scrollToItem(selectedModule.moduleId);
    }
  }, [isModuleDropdownOpen]);

  useEffect(() => {
    if (studentProfiles) {
      setStudentsMap(
        new Map(studentProfiles.map((item,itm) => [itm+1, item])),
      );
    }
  }, [studentProfiles]);


  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `job-evaluation-${selectedModuleWithDates?.moduleName?.slice(0, 40).split(" ").join("-") || "report"}`,
  });

  useEffect(() => {
    if (!selectedModule) {
      setSelectedModuleWithDates(null);
      return;
    }

    const fetchDatesForModule = async () => {
      setIsLoading(true);
      try {
        const moduleIdNumber = +selectedModule.moduleId.match(/\d+/)?.[0];

        let minDate = null;
        let maxDate = null;

        if (moduleIdNumber) {
          const rawDates = await dailyDiaryService.getDatesByPracticalNumber(
            batchData.$id,
            moduleIdNumber,
          );

          const dateObjects = rawDates
            .map((date) => (date ? parseISO(date) : null))
            .filter((date) => date instanceof Date && !isNaN(date));

          minDate = dateObjects.length
            ? format(min(dateObjects), "yyyy-MM-dd")
            : null;
          maxDate = dateObjects.length
            ? format(max(dateObjects), "yyyy-MM-dd")
            : null;

          if (minDate && maxDate) {
            // Fetch attendance only for this date range
            const queries = [
              Query.greaterThanEqual("date", minDate),
              Query.lessThanEqual("date", maxDate),
              Query.select(["userId", "date", "status"])
            ];
            
            const attendanceRes = await newAttendanceService.getAllBatchAttendance(batchData.$id, queries);
            
            // Map flat attendance records to { userId: { date: status } }
            const dateKeysAttendance = attendanceRes.documents.reduce((acc, doc) => {
              if (!acc[doc.userId]) acc[doc.userId] = {};
              if (!acc[doc.userId][doc.date]) {
                acc[doc.userId][doc.date] = doc.status;
              }
              return acc;
            }, {});
            
            setStudentAttendance(dateKeysAttendance);
          } else {
            setStudentAttendance({});
          }
        }

        setSelectedModuleWithDates({
          ...selectedModule,
          startDate: minDate,
          endDate: maxDate,
        });
      } catch (err) {
        console.error("Failed to map module practical dates or fetch attendance:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatesForModule();
  }, [selectedModule, batchData.$id]);

  const fetchSubject = async () => {
    try {
      const res = await subjectService.getSubjectByName("Trade Practical");
      console.log("subject",res);
      return res;
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch modules based on selected subject and year
  const fetchModules = async () => {
    try {
      if (!selectedYear) return;
      const subject = await fetchSubject();
      if (!subject || !subject.$id) {
        console.warn("No Practical subject found for this trade.");
        setModules([]);
        return;
      }
      const data = await moduleServices.getNewModulesData(
        batchData.tradeId,
        subject.$id,
        selectedYear,
      );

      const sortedData =
        data?.sort(
          (a, b) => a.moduleId.match(/\d+/)?.[0] - b.moduleId.match(/\d+/)?.[0],
        ) || [];

      setModules(sortedData);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  useEffect(() => {
    setModules([]);
    fetchModules();
  }, [selectedYear, batchData.tradeId]);

  if (isLoading || collegeDataLoading) {
    return <Loader isLoading={isLoading} />;
  }

  return (
    <div className="w-full mx-auto p-4 sm:p-6 text-sm dark:bg-gray-900 flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Side: Menus & Controls */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:sticky top-6">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md shadow-xs dark:bg-gray-800 dark:border-gray-700 dark:text-blue-300">
          <ul className="list-disc ml-6 space-y-2 dark:text-gray-300">
            <li>Add students attendance to ensure accurate evaluations.</li>
            <li>
              Include daily diary entries with Practical Number to support a
              correct job evaluation report.
            </li>
          </ul>
        </div>

        {/* Dropdowns for Subject, Year, Module, and Student */}
        <div className="grid grid-cols-1 gap-4">
        {/* Year Dropdown */}
        <div className="relative">
          <h1 className="text-gray-700 dark:text-white mb-1">Select Year:</h1>
          <button
            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            className="w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-xs hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
          >
            <span className="text-gray-700 dark:text-white">
              {selectedYear}
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
          {isYearDropdownOpen && (
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
              {["FIRST", "SECOND"].map((year) => (
                <div
                  key={year}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-700 dark:text-white"
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
          <h1 className="text-gray-700 dark:text-white mb-1">Select Job:</h1>
          <button
            onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
            className="w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-xs hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
          >
            <span className="text-gray-700 dark:text-white truncate">
              {selectedModule
                ? selectedModule.moduleId.slice(1) +
                  "-" +
                  selectedModule.moduleName
                : "Select Module"}
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

          <div
            className={`${
              isModuleDropdownOpen ? "block" : "hidden"
            } absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700 dark:text-white`}
          >
            {modules &&
              modules?.map((module) => (
                <div
                  ref={(el) => (itemRefs.current[module.moduleId] = el)}
                  key={module.moduleId}
                  className={`${
                    selectedModule?.moduleId === module?.moduleId
                      ? "bg-gray-200 dark:bg-gray-700"
                      : "bg-white dark:bg-gray-800"
                  } px-4 py-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-700 dark:text-white`}
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

      {/* Print Button */}
      {Array.isArray(modules) && selectedModuleWithDates && (
        <button
          onClick={handlePrint}
          className="w-full sm:w-64 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          <Printer className="h-5 w-5" />
          Print / Save PDF
        </button>
      )}

      {/* Page capacity hint */}
      {selectedModuleWithDates && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Showing {studentsMap.size} student{studentsMap.size !== 1 ? "s" : ""} — pagination auto-applied ({Math.min(studentsMap.size || 1, 24)} per page).
        </p>
      )}
        </div>
      {/* Right Side: Live Preview */}
      <div className="w-full lg:w-2/3">
        <div className="overflow-auto border rounded-lg shadow-xs dark:border-gray-700 bg-white">
          {selectedModuleWithDates ? (
            <JobEvaluationPrintDynamic
              ref={printRef}
              data={jobEvaluationDataAdapter.adaptLegacyData(
                studentsMap,
                college,
                selectedModuleWithDates,
                studentAttendance,
              )}
              studentsPerPage={Math.min(studentsMap.size || 1, 24)}
            />
          ) : (
            <div className="w-full h-[600px] sm:h-[842px] flex items-center justify-center bg-white dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                Select a module to view the job evaluation report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobEvaluation;
