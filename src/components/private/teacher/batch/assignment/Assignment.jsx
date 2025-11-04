import questionpaperservice from "@/appwrite/mockTest";
import moduleServices from "@/appwrite/moduleServices";
import subjectService from "@/appwrite/subjectService";
import { Query } from "node-appwrite";
import React, { useEffect, useState, useMemo } from "react";

const Assignment = ({ students, batchData }) => {

  const hasValidProps = students && Array.isArray(students) && students.length > 0;
  const hasBatchData = batchData && batchData.tradeId;
  
  if (!hasValidProps || !hasBatchData) {
    return null;
  }

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
  const [activeTab, setActiveTab] = useState('table'); // 'table' or 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
        
        setModules({ 
          data: data.sort((a, b) => {
            const aNum = a.moduleId.match(/\d+/g)?.[0];
            const bNum = b.moduleId.match(/\d+/g)?.[0];
            return (aNum || 0) - (bNum || 0);
          }), 
          selectedModule: null 
        });
        
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

  // Create optimized score lookup map
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

  // Calculate student statistics
  const studentStats = useMemo(() => {
    return students.map(student => {
      let total = 0;
      let count = 0;
      let completed = 0;
      
      assignmentScore.forEach(assignment => {
        const score = scoreMap.get(assignment.assessmentPaperId)?.get(student.userId);
        if (score) {
          total += score.score;
          count++;
          completed++;
        }
      });
      
      return {
        ...student,
        average: count > 0 ? (total / count).toFixed(2) : 0,
        completed,
        total: assignmentScore.length
      };
    });
  }, [students, assignmentScore, scoreMap]);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let filtered = studentStats.filter(student => {
      const name = student.userName || student.name || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (scoreFilter) {
        const hasScore = assignmentScore.some(assignment => {
          const score = scoreMap.get(assignment.assessmentPaperId)?.get(student.userId);
          if (scoreFilter === 'NA') {
            return !score;
          }
          return score && score.score.toString() === scoreFilter;
        });
        return matchesSearch && hasScore;
      }
      
      return matchesSearch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal, bVal;
        
        if (sortConfig.key === 'name') {
          aVal = (a.userName || a.name || '').toLowerCase();
          bVal = (b.userName || b.name || '').toLowerCase();
        } else if (sortConfig.key === 'average') {
          aVal = parseFloat(a.average);
          bVal = parseFloat(b.average);
        } else {
          // Sort by specific module
          const aScore = scoreMap.get(sortConfig.key)?.get(a.userId);
          const bScore = scoreMap.get(sortConfig.key)?.get(b.userId);
          aVal = aScore ? aScore.score : -1;
          bVal = bScore ? bScore.score : -1;
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [studentStats, searchTerm, scoreFilter, sortConfig, assignmentScore, scoreMap]);

  // Handlers
  const handleSubjectChange = (e) => {
    const selectedId = e.target.value;
    const selected = subjectData.data.find((item) => item.$id === selectedId);
    setSubjectData(prev => ({ ...prev, selectedSubject: selected || null }));
    setAssignmentsScore([]);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleYearChange = (e) => {
    setYear(prev => ({ ...prev, selectedYear: e.target.value || null }));
    setAssignmentsScore([]);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setScoreFilter('');
    setSortConfig({ key: null, direction: 'asc' });
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleExport = () => {
    let csv = 'Student Name,';
    csv += assignmentScore.map(a => a.moduleId).join(',');
    csv += ',Average,Completed,Total\n';
    
    filteredStudents.forEach(student => {
      const name = student.userName || student.name || 'Unknown';
      let row = `"${name}",`;
      
      assignmentScore.forEach(assignment => {
        const score = scoreMap.get(assignment.assessmentPaperId)?.get(student.userId);
        row += (score ? score.score : 'NA') + ',';
      });
      
      row += `${student.average},${student.completed},${student.total}\n`;
      csv += row;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assignment_scores.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to get student score
  const getStudentScore = (assessmentPaperId, userId) => {
    return scoreMap.get(assessmentPaperId)?.get(userId);
  };

  // Create score badge
  const getScoreBadge = (score) => {
    if (!score) {
      return (
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-110 cursor-pointer">
          <span className="text-sm">NA</span>
        </div>
      );
    }
    
    const scoreNum = score.score;
    let gradient = 'from-red-400 to-rose-600';
    
    if (scoreNum >= 5) gradient = 'from-green-400 to-emerald-600';
    else if (scoreNum >= 4) gradient = 'from-blue-400 to-cyan-600';
    else if (scoreNum >= 3) gradient = 'from-yellow-400 to-amber-600';
    else if (scoreNum >= 2) gradient = 'from-orange-400 to-orange-600';
    
    return (
      <div 
        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${gradient} text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-110 cursor-pointer`}
        title={`Score: ${scoreNum}`}
      >
        {scoreNum}
      </div>
    );
  };

  // Analytics data
  const topPerformers = useMemo(() => {
    return [...studentStats]
      .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
      .slice(0, 10);
  }, [studentStats]);

  const moduleAverages = useMemo(() => {
    return assignmentScore.map(assignment => {
      let total = 0;
      let count = 0;
      
      students.forEach(student => {
        const score = scoreMap.get(assignment.assessmentPaperId)?.get(student.userId);
        if (score) {
          total += score.score;
          count++;
        }
      });
      
      return {
        moduleId: assignment.moduleId,
        moduleName: assignment.moduleName,
        average: count > 0 ? (total / count).toFixed(2) : 0
      };
    });
  }, [assignmentScore, students, scoreMap]);

  const scoreDistribution = useMemo(() => {
    const dist = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0, '0': 0, 'NA': 0 };
    
    students.forEach(student => {
      assignmentScore.forEach(assignment => {
        const score = scoreMap.get(assignment.assessmentPaperId)?.get(student.userId);
        if (score) {
          dist[score.toString()]++;
        } else {
          dist['NA']++;
        }
      });
    });
    
    return dist;
  }, [students, assignmentScore, scoreMap]);

  // Calculations
  const totalPages = Math.ceil(pagination.totalItems / pagination.pageSize) || 1;
  const hasData = subjectData.selectedSubject && year.selectedYear;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with animated gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 mb-6 text-white animate-gradient">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            📊 Assignment Tracker
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base mb-4">
            Track student performance across modules and assessments
          </p>
          
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl px-6 py-3 transform hover:scale-105 transition-all">
              <div className="text-3xl font-bold">{students?.length || 0}</div>
              <div className="text-sm text-indigo-100">Students</div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-xl px-6 py-3 transform hover:scale-105 transition-all">
              <div className="text-3xl font-bold">{assignmentScore.length}</div>
              <div className="text-sm text-indigo-100">Modules</div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-xl px-6 py-3 transform hover:scale-105 transition-all">
              <div className="text-3xl font-bold">{modules.data.length}</div>
              <div className="text-sm text-indigo-100">Total Available</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-lg animate-slideDown">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔍</span> Filters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="transform hover:scale-[1.02] transition-transform">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={subjectData.selectedSubject?.$id || ""}
                onChange={handleSubjectChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-300"
              >
                <option value="">Select Subject</option>
                {subjectData.data.map((item) => (
                  <option value={item.$id} key={item.$id}>
                    {item.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="transform hover:scale-[1.02] transition-transform">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year
              </label>
              <select
                value={year.selectedYear || ""}
                onChange={handleYearChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-300"
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

        {/* Tab Navigation */}
        {assignmentScore.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('table')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'table'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📊 Score Table
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📈 Analytics
              </button>
            </div>

            {/* Search and Filter Controls */}
            {activeTab === 'table' && (
              <div className="p-6 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="🔍 Search student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="">All Scores</option>
                    <option value="5">Score 5</option>
                    <option value="4">Score 4</option>
                    <option value="3">Score 3</option>
                    <option value="2">Score 2</option>
                    <option value="1">Score 1</option>
                    <option value="0">Score 0</option>
                    <option value="NA">Not Attempted</option>
                  </select>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transform hover:scale-105 transition-all shadow-lg"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all shadow-lg"
                  >
                    📥 Export
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {modules.data.length > 0 && activeTab === 'table' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || pagination.isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg disabled:transform-none"
                >
                  ← Previous
                </button>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= totalPages || pagination.isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg disabled:transform-none"
                >
                  Next →
                </button>
              </div>

              <div className="text-center sm:text-right">
                <p className="text-base font-bold text-gray-900">
                  Page {pagination.currentPage} of {totalPages}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {pagination.totalItems} total modules
                </p>
              </div>

              {pagination.isLoading && (
                <div className="flex items-center gap-2 text-indigo-600">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
                  <span className="text-sm font-semibold">Loading...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table View */}
        {activeTab === 'table' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {assignmentScore.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                    <tr>
                      <th 
                        onClick={() => handleSort('name')}
                        className="sticky left-0 z-20 px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-r border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Student Name
                          {sortConfig.key === 'name' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      {assignmentScore.map((assignment, idx) => (
                        <th
                          key={`${assignment.assessmentPaperId}-${idx}`}
                          onClick={() => handleSort(assignment.assessmentPaperId)}
                          className="px-4 py-4 text-center min-w-[120px] cursor-pointer hover:bg-white/10 transition-colors"
                        >
                          <div 
                            className="text-sm font-bold text-white uppercase tracking-wide truncate"
                            title={assignment.moduleName}
                          >
                            {assignment.moduleId}
                          </div>
                          <div className="text-xs text-indigo-100 mt-1 font-mono truncate">
                            {assignment.assessmentPaperId.substring(0, 8)}...
                          </div>
                        </th>
                      ))}
                      <th
                        onClick={() => handleSort('average')}
                        className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-center gap-2">
                          Average
                          {sortConfig.key === 'average' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student, idx) => {
                      const studentName = student.userName || student.name || 'Unknown';
                      
                      return (
                        <tr
                          key={student.userId}
                          onClick={() => handleStudentClick(student)}
                          className={`hover:bg-indigo-50 transition-all cursor-pointer transform hover:scale-[1.01] ${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap font-semibold text-gray-900 bg-inherit border-r border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
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
                                className="px-4 py-4 text-center"
                              >
                                <div className="flex justify-center items-center">
                                  {getScoreBadge(studentScore)}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg">
                              {student.average}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                {!hasData ? (
                  <div className="animate-fadeIn">
                    <div className="text-8xl mb-4">📋</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Get Started
                    </h3>
                    <p className="text-base text-gray-600 max-w-md mx-auto">
                      Select a subject and year from the filters above to view assignment data
                    </p>
                  </div>
                ) : pagination.isLoading ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <svg className="animate-spin h-16 w-16 text-indigo-600" viewBox="0 0 24 24">
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
                    <p className="text-lg font-semibold text-gray-700">Loading assignment data...</p>
                  </div>
                ) : (
                  <div className="animate-fadeIn">
                    <div className="text-8xl mb-4">📭</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      No Data Available
                    </h3>
                    <p className="text-base text-gray-600">
                      No assignment data found for the selected filters
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Analytics View */}
        {activeTab === 'analytics' && assignmentScore.length > 0 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Performers Leaderboard */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">🏆</span> Top Performers Leaderboard
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topPerformers.map((student, index) => {
                  const name = student.userName || student.name || 'Unknown';
                  let rankClass = '';
                  let medal = '';
                  
                  if (index === 0) {
                    rankClass = 'from-yellow-400 to-yellow-600';
                    medal = '🥇';
                  } else if (index === 1) {
                    rankClass = 'from-gray-300 to-gray-500';
                    medal = '🥈';
                  } else if (index === 2) {
                    rankClass = 'from-orange-400 to-orange-600';
                    medal = '🥉';
                  } else {
                    rankClass = 'from-indigo-400 to-purple-600';
                  }
                  
                  return (
                    <div
                      key={student.userId}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 flex items-center gap-4 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl cursor-pointer"
                      onClick={() => handleStudentClick(student)}
                    >
                      <div className={`flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br ${rankClass} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                        {medal || (index + 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">{name}</div>
                        <div className="text-sm text-gray-600">
                          Average: <span className="font-semibold text-indigo-600">{student.average}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Completed: {student.completed}/{student.total}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Performance Chart */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">📊</span> Average Scores by Module
              </h3>
              <div className="flex items-end justify-around h-64 gap-2 px-4">
                {moduleAverages.map((module, index) => {
                  const height = (parseFloat(module.average) / 5) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-lg relative transform hover:scale-105 transition-all cursor-pointer shadow-lg"
                        style={{ height: `${height}%`, minHeight: '20px' }}
                        title={`${module.moduleName}: ${module.average}`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 font-bold text-indigo-600 text-sm whitespace-nowrap">
                          {module.average}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-gray-700 mt-2 text-center truncate w-full">
                        {module.moduleId}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">📈</span> Score Distribution
              </h3>
              <div className="flex items-end justify-around h-64 gap-3 px-4">
                {Object.entries(scoreDistribution).map(([score, count]) => {
                  const maxCount = Math.max(...Object.values(scoreDistribution));
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  let gradient = 'from-gray-400 to-gray-600';
                  if (score === '5') gradient = 'from-green-400 to-emerald-600';
                  else if (score === '4') gradient = 'from-blue-400 to-cyan-600';
                  else if (score === '3') gradient = 'from-yellow-400 to-amber-600';
                  else if (score === '2') gradient = 'from-orange-400 to-orange-600';
                  else if (score === '1' || score === '0') gradient = 'from-red-400 to-rose-600';
                  
                  return (
                    <div key={score} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className={`w-full bg-gradient-to-t ${gradient} rounded-t-lg relative transform hover:scale-105 transition-all cursor-pointer shadow-lg`}
                        style={{ height: `${height}%`, minHeight: '20px' }}
                        title={`Score ${score}: ${count} occurrences`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 font-bold text-gray-700 text-sm">
                          {count}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-700 mt-2">
                        {score}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        {assignmentScore.length > 0 && activeTab === 'table' && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📖 Legend</h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                  5
                </div>
                <span className="text-sm font-medium text-gray-700">Excellent (5)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg">
                  4
                </div>
                <span className="text-sm font-medium text-gray-700">Very Good (4)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
                  3
                </div>
                <span className="text-sm font-medium text-gray-700">Good (3)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg">
                  2
                </div>
                <span className="text-sm font-medium text-gray-700">Fair (2)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg">
                  1
                </div>
                <span className="text-sm font-medium text-gray-700">Poor (1-0)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold shadow-lg">
                  NA
                </div>
                <span className="text-sm font-medium text-gray-700">Not Attempted</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedStudent.userName || selectedStudent.name || 'Unknown'}
                </h2>
                <p className="text-indigo-100 text-sm mt-1">Student Performance Details</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Overall Stats */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-indigo-600">{selectedStudent.average}</div>
                    <div className="text-sm text-gray-600 mt-1">Average Score</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">{selectedStudent.completed}</div>
                    <div className="text-sm text-gray-600 mt-1">Completed</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-600">{selectedStudent.total}</div>
                    <div className="text-sm text-gray-600 mt-1">Total</div>
                  </div>
                </div>
              </div>

              {/* Module Scores */}
              <h3 className="text-lg font-bold text-gray-900 mb-4">Module Scores</h3>
              <div className="space-y-3">
                {assignmentScore.map((assignment, index) => {
                  const score = getStudentScore(assignment.assessmentPaperId, selectedStudent.userId);
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {assignment.moduleId} - {assignment.moduleName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {assignment.assessmentPaperId}
                        </div>
                      </div>
                      <div>
                        {getScoreBadge(score)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Assignment;