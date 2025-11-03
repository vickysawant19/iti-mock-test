import questionpaperservice from "@/appwrite/mockTest";
import moduleServices from "@/appwrite/moduleServices";
import subjectService from "@/appwrite/subjectService";
import { Query } from "node-appwrite";
import React, { useEffect, useState, useMemo } from "react";

const Assignment = ({ students, batchData }) => {
  // State management
  const [subjectData, setSubjectData] = useState({
    data: [],
    selectedSubject: null,
  });
  
  const [year, setYear] = useState({
    data: ["FIRST", "SECOND"],
    selectedYear: null,
  });
  
  const [modules, setModules] = useState({
    data: [],
    selectedModule: null,
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
    isLoading: false,
  });

  const [assignmentScore, setAssignmentsScore] = useState([]);
  const [error, setError] = useState(null);

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setError(null);
        const response = await subjectService.listAllSubjects();
        setSubjectData(prev => ({
          ...prev,
          data: response || [],
        }));
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setError("Failed to load subjects");
      }
    };
    
    fetchSubjects();
  }, []);

  // Fetch modules when subject, year, or batch changes
  useEffect(() => {
    const fetchModules = async () => {
      if (!subjectData.selectedSubject || !year.selectedYear || !batchData) {
        setModules({ data: [], selectedModule: null });
        setAssignmentsScore([]);
        return;
      }

      try {
        setError(null);
        setPagination(prev => ({ ...prev, isLoading: true }));
        
        const data = await moduleServices.getNewModulesData(
          batchData.tradeId,
          subjectData.selectedSubject.$id,
          year.selectedYear
        );
        
        setModules({ data: data.sort((a, b) => a.moduleId.match(/\d+/g)[0] - b.moduleId.match(/\d+/g)[0] ||  []), selectedModule: null });
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalItems: (data || []).length,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error fetching modules:", error);
        setError("Failed to load modules");
        setModules({ data: [], selectedModule: null });
        setPagination(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchModules();
  }, [subjectData.selectedSubject, year.selectedYear, batchData]);

  // Fetch assignment scores when modules or page changes
  useEffect(() => {
    const fetchAssignmentsScore = async () => {
      if (!modules.data || modules.data.length === 0 || !students?.length) {
        setAssignmentsScore([]);
        return;
      }

      setPagination(prev => ({ ...prev, isLoading: true }));

      try {
        setError(null);
        const studentsIds = students.map((st) => st.userId);

        // Calculate pagination
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedModules = modules.data.slice(startIndex, endIndex);

        const assessmentPaperIds = paginatedModules.map((m) => m.assessmentPaperId);

        const paperData = await questionpaperservice.listQuestions([
          Query.equal("paperId", assessmentPaperIds),
          Query.orderDesc("$updatedAt"),
          Query.equal("userId", studentsIds),
          Query.select(["$id", "paperId", "userName", "userId", "score"]),
        ]);

        // Group papers by paperId for O(1) lookup
        const paperMap = new Map();
        (paperData || []).forEach((paper) => {
          if (!paperMap.has(paper.paperId)) {
            paperMap.set(paper.paperId, []);
          }
          paperMap.get(paper.paperId).push(paper);
        });

        // Map modules with their scores
        const assessmentDataWithScores = paginatedModules.map((m) => ({
          moduleId: m.moduleId,
          moduleName: m.moduleName,
          assessmentPaperId: m.assessmentPaperId,
          scores: paperMap.get(m.assessmentPaperId) || [],
        }));

        setAssignmentsScore(assessmentDataWithScores);
      } catch (error) {
        console.error("Error fetching assignment scores:", error);
        setError("Failed to load assignment scores");
        setAssignmentsScore([]);
      } finally {
        setPagination(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchAssignmentsScore();
  }, [modules.data, pagination.currentPage, students]);

  // Create optimized score lookup map: Map<assessmentPaperId, Map<userId, score>>
  const scoreMap = useMemo(() => {
    const map = new Map();
    
    assignmentScore.forEach((assignment) => {
      const userScoreMap = new Map();
      assignment.scores.forEach((score) => {
        userScoreMap.set(score.userId, score);
      });
      map.set(assignment.assessmentPaperId, userScoreMap);
    });
    
    return map;
  }, [assignmentScore]);

  // Handlers
  const handleSubjectChange = (e) => {
    const selectedId = e.target.value;
    const selected = subjectData.data.find((item) => item.$id === selectedId);
    setSubjectData(prev => ({ ...prev, selectedSubject: selected || null }));
    setAssignmentsScore([]);
  };

  const handleYearChange = (e) => {
    setYear(prev => ({ ...prev, selectedYear: e.target.value || null }));
    setAssignmentsScore([]);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  // Calculations
  const totalPages = Math.ceil(pagination.totalItems / pagination.pageSize) || 1;
  const hasData = subjectData.selectedSubject && year.selectedYear;

  // Helper function to get student score efficiently
  const getStudentScore = (assessmentPaperId, userId) => {
    return scoreMap.get(assessmentPaperId)?.get(userId);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Assignment Tracker
        </h1>
        <p className="text-sm text-gray-600">
          Track student performance across modules and assessments
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Subject Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={subjectData.selectedSubject?.$id || ""}
              onChange={handleSubjectChange}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select Subject</option>
              {subjectData.data.map((item) => (
                <option value={item.$id} key={item.$id}>
                  {item.subjectName}
                </option>
              ))}
            </select>
          </div>

          {/* Year Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={year.selectedYear || ""}
              onChange={handleYearChange}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select Year</option>
              {year.data.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {modules.data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || pagination.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-sm"
              >
                Previous
              </button>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= totalPages || pagination.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-sm font-medium text-gray-700">
                Page {pagination.currentPage} of {totalPages}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pagination.totalItems} total modules
              </p>
            </div>

            {pagination.isLoading && (
              <div className="flex items-center gap-2 text-blue-600">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm font-medium">Loading...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment Score Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {assignmentScore.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-linear-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="sticky left-0 z-20 px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-linear-to-r from-blue-50 to-indigo-50 border-r border-gray-200">
                    Student Name
                  </th>
                  {assignmentScore.map((assignment, idx) => (
                    <th
                      key={`${assignment.assessmentPaperId}-${idx}`}
                      className="px-4 py-4 text-center min-w-[120px]"
                    >
                      <div 
                        className="text-xs font-semibold text-gray-700 uppercase tracking-wide truncate"
                        title={assignment.moduleName}
                      >
                        {assignment.moduleId } 
                        {/* {assignment.moduleName} */}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        {assignment.assessmentPaperId}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, idx) => {
                  const studentName = student.userName || student.name || 'Unknown';
                  
                  return (
                    <tr
                      key={student.userId}
                      className={`hover:bg-gray-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap font-medium text-gray-900 bg-inherit border-r border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">
                            {studentName}
                          </span>
                        </div>
                      </td>
                      {assignmentScore.map((assignment, assignmentIdx) => {
                        const studentScore = getStudentScore(assignment.assessmentPaperId, student.userId);

                        return (
                          <td
                            key={`${assignment.assessmentPaperId}-${assignmentIdx}`}
                            className="px-2 py-2 text-center"
                          >
                            <div className="flex justify-center items-center">
                              {studentScore ? (
                                <div
                                  className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-110 cursor-pointer"
                                  title={`Score: ${studentScore.score}`}
                                >
                                  {studentScore.score}
                                </div>
                              ) : (
                                <div
                                  className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white font-bold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-110 cursor-pointer"
                                  title="Not attempted"
                                >
                                  <span className="text-xl">−</span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            {!hasData ? (
              <div>
                <svg
                  className="mx-auto h-16 w-16 text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Get Started
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Select a subject and year from the filters above to view assignment data
                </p>
              </div>
            ) : pagination.isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700">Loading assignment data...</p>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-16 w-16 text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Data Available
                </h3>
                <p className="text-sm text-gray-500">
                  No assignment data found for the selected filters
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {assignmentScore.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                5
              </div>
              <span className="text-sm text-gray-600">Assessment Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                −
              </div>
              <span className="text-sm text-gray-600">Not Attempted</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignment;