import questionpaperservice from "@/appwrite/mockTest";
import moduleServices from "@/appwrite/moduleServices";
import subjectService from "@/appwrite/subjectService";
import { Query } from "node-appwrite";
import React, { useEffect, useState, useMemo } from "react";
import AssignmentHeader from "./components/AssignmentHeader";
import AssignmentFilters from "./components/AssignmentFilters";
import AssignmentTabsAndControls from "./components/AssignmentTabsAndControls";
import PaginationControls from "./components/PaginationControls";
import ScoreTable from "./components/ScoreTable";
import AnalyticsView from "./components/AnalyticsView";
import StudentDetailsModal from "./components/StudentDetailsModal";
import Legend from "./components/Legend";
import ErrorMessage from "./components/ErrorMessage";

const Assignment = ({ students, batchData }) => {
  const hasValidProps =
    students && Array.isArray(students) && students.length > 0;
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
    pageSize: 30,
    totalItems: 0,
    isLoading: false,
  });

  const [assignmentScore, setAssignmentsScore] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("table"); // 'table' or 'analytics'
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setError(null);
        const response = await subjectService.listAllSubjects();
        setSubjectData((prev) => ({
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
        setPagination((prev) => ({ ...prev, isLoading: true }));

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
          selectedModule: null,
        });

        setPagination((prev) => ({
          ...prev,
          currentPage: 1,
          totalItems: (data || []).length,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error fetching modules:", error);
        setError("Failed to load modules");
        setModules({ data: [], selectedModule: null });
        setPagination((prev) => ({ ...prev, isLoading: false }));
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

      setPagination((prev) => ({ ...prev, isLoading: true }));

      try {
        setError(null);
        const studentsIds = students.map((st) => st.userId);

        // Calculate pagination
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedModules = modules.data.slice(startIndex, endIndex);

        const assessmentPaperIds = paginatedModules.map(
          (m) => m.assessmentPaperId
        );

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
        setPagination((prev) => ({ ...prev, isLoading: false }));
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
    return students.map((student) => {
      let total = 0;
      let count = 0;
      let completed = 0;

      assignmentScore.forEach((assignment) => {
        const score = scoreMap
          .get(assignment.assessmentPaperId)
          ?.get(student.userId);
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
        total: assignmentScore.length,
      };
    });
  }, [students, assignmentScore, scoreMap]);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let filtered = studentStats.filter((student) => {
      const name = student.userName || student.name || "";
      const matchesSearch = name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      if (scoreFilter) {
        const hasScore = assignmentScore.some((assignment) => {
          const score = scoreMap
            .get(assignment.assessmentPaperId)
            ?.get(student.userId);
          if (scoreFilter === "NA") {
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

        if (sortConfig.key === "name") {
          aVal = (a.userName || a.name || "").toLowerCase();
          bVal = (b.userName || b.name || "").toLowerCase();
        } else if (sortConfig.key === "average") {
          aVal = parseFloat(a.average);
          bVal = parseFloat(b.average);
        } else {
          // Sort by specific module
          const aScore = scoreMap.get(sortConfig.key)?.get(a.userId);
          const bScore = scoreMap.get(sortConfig.key)?.get(b.userId);
          aVal = aScore ? aScore.score : -1;
          bVal = bScore ? bScore.score : -1;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    studentStats,
    searchTerm,
    scoreFilter,
    sortConfig,
    assignmentScore,
    scoreMap,
  ]);

  // Handlers
  const handleSubjectChange = (e) => {
    const selectedId = e.target.value;
    const selected = subjectData.data.find((item) => item.$id === selectedId);
    setSubjectData((prev) => ({ ...prev, selectedSubject: selected || null }));
    setAssignmentsScore([]);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleYearChange = (e) => {
    setYear((prev) => ({ ...prev, selectedYear: e.target.value || null }));
    setAssignmentsScore([]);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setScoreFilter("");
    setSortConfig({ key: null, direction: "asc" });
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleExport = () => {
    let csv = "Student Name,";
    csv += assignmentScore.map((a) => a.moduleId).join(",");
    csv += ",Average,Completed,Total\n";

    filteredStudents.forEach((student) => {
      const name = student.userName || student.name || "Unknown";
      let row = `"${name}",`;

      assignmentScore.forEach((assignment) => {
        const score = scoreMap
          .get(assignment.assessmentPaperId)
          ?.get(student.userId);
        row += (score ? score.score : "NA") + ",";
      });

      row += `${student.average},${student.completed},${student.total}\n`;
      csv += row;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assignment_scores.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to get student score
  const getStudentScore = (assessmentPaperId, userId) => {
    return scoreMap.get(assessmentPaperId)?.get(userId);
  };

  // Analytics data
  const topPerformers = useMemo(() => {
    return [...studentStats]
      .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
      .slice(0, 10);
  }, [studentStats]);

  const moduleAverages = useMemo(() => {
    return assignmentScore.map((assignment) => {
      let total = 0;
      let count = 0;

      students.forEach((student) => {
        const score = scoreMap
          .get(assignment.assessmentPaperId)
          ?.get(student.userId);
        if (score) {
          total += score.score;
          count++;
        }
      });

      return {
        moduleId: assignment.moduleId,
        moduleName: assignment.moduleName,
        average: count > 0 ? (total / count).toFixed(2) : 0,
      };
    });
  }, [assignmentScore, students, scoreMap]);

  const scoreDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0, NA: 0 };

    students.forEach((student) => {
      assignmentScore.forEach((assignment) => {
        const score = scoreMap
          .get(assignment.assessmentPaperId)
          ?.get(student.userId);
        if (score && score.score !== null) {
          dist[score.score.toString()]++;
        } else {
          dist["NA"]++;
        }
      });
    });

    return dist;
  }, [students, assignmentScore, scoreMap]);

  // Calculations
  const totalPages =
    Math.ceil(pagination.totalItems / pagination.pageSize) || 1;
  const hasData = subjectData.selectedSubject && year.selectedYear;

  return (
    <div className="min-h-screen">
      <div className="">
        <AssignmentHeader
          students={students}
          assignmentScore={assignmentScore}
          modules={modules}
        />
        <ErrorMessage error={error} />
        <AssignmentFilters
          subjectData={subjectData}
          handleSubjectChange={handleSubjectChange}
          year={year}
          handleYearChange={handleYearChange}
        />

        {assignmentScore.length > 0 && (
          <AssignmentTabsAndControls
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            scoreFilter={scoreFilter}
            setScoreFilter={setScoreFilter}
            handleReset={handleReset}
            handleExport={handleExport}
          />
        )}

        {modules.data.length > 0 && activeTab === "table" && (
          <PaginationControls
            pagination={pagination}
            handlePageChange={handlePageChange}
            totalPages={totalPages}
          />
        )}

        {activeTab === "table" && (
          <ScoreTable
            filteredStudents={filteredStudents}
            handleStudentClick={handleStudentClick}
            assignmentScore={assignmentScore}
            getStudentScore={getStudentScore}
            handleSort={handleSort}
            sortConfig={sortConfig}
            hasData={hasData}
            pagination={pagination}
          />
        )}

        {activeTab === "analytics" && assignmentScore.length > 0 && (
          <AnalyticsView
            topPerformers={topPerformers}
            moduleAverages={moduleAverages}
            scoreDistribution={scoreDistribution}
            handleStudentClick={handleStudentClick}
          />
        )}

        {assignmentScore.length > 0 && activeTab === "table" && <Legend />}
      </div>

      <StudentDetailsModal
        showModal={showModal}
        setShowModal={setShowModal}
        selectedStudent={selectedStudent}
        assignmentScore={assignmentScore}
        getStudentScore={getStudentScore}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
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
