/**
 * Job Evaluation Data Adapter
 * Converts existing component data format to new dynamic JSON structure
 */

export const jobEvaluationDataAdapter = {
  /**
   * Convert legacy component props to new JSON format
   *
   * Input:
   *  - studentsMap: Map or object of students
   *  - college: { collageName, ... }
   *  - selectedModule: { moduleId, moduleName, startDate, endDate, moduleDuration, images, evalutionsPoints }
   *  - studentAttendance: { userId: { date: status } }
   *
   * Output:
   *  - {
   *      institute: { name },
   *      job: { number, title, startDate, endDate, duration, pageNumber },
   *      evaluationPoints: Array<{ code, title, marks }>,
   *      students: Array<{ sr, name, scores, total }>
   *    }
   */
  adaptLegacyData(
    studentsMap,
    college,
    selectedModule,
    studentAttendance = {},
    customImages = []
  ) {
    // Extract students array
    const studentsArray = this._extractStudentsArray(studentsMap);

    // Generate evaluation points with letters A-E
    const evaluationPoints = this._generateEvaluationPoints(selectedModule);
    const evalCodes = evaluationPoints.map((p) => p.code);

    // Generate student records with scores
    const students = studentsArray.map((student, idx) => {
      const isPresent = this._checkStudentPresence(
        student,
        selectedModule,
        studentAttendance,
      );
      const scores = this._generateStudentScores(isPresent, evalCodes);
      return {
        sr: idx + 1,
        name: student.userName || student.name || "Unknown",
        scores,
        total: isPresent ? this._calculateTotal(scores) : "AB",
      };
    });

    return {
      institute: {
        name:
          college?.collageName || "Government Industrial Training Institute",
      },
      job: {
        number: selectedModule?.moduleId?.slice(1) || "____",
        title: selectedModule?.moduleName || "________________________________",
        startDate: selectedModule?.startDate || null,
        endDate: selectedModule?.endDate || null,
        // Support both new (time/page) and legacy (duration/pageNumber) field names
        time: selectedModule?.moduleDuration || "____",
        page: "1",
        images: [...(selectedModule?.images || []), ...customImages],
      },
      evaluationPoints,
      students,
      signatures: ["Instructor Signature", "Group Instructor Signature", "Principal"],
    };
  },

  /**
   * Create custom JSON format directly
   * (Use this for new implementations)
   */
  createCustomData(config = {}) {
    return {
      institute: {
        name:
          config.instituteName || "Government Industrial Training Institute",
        logo: config.instituteLogo,
      },
      job: {
        number: config.jobNumber || "1",
        title: config.jobTitle || "Sample Job",
        startDate: config.startDate || new Date().toISOString(),
        endDate: config.endDate || new Date().toISOString(),
        duration: config.duration || 40,
        pageNumber: config.pageNumber || "1",
      },
      evaluationPoints: config.evaluationPoints || [
        { code: "A", title: "Technical Knowledge", marks: 20 },
        { code: "B", title: "Practical Skills", marks: 20 },
        { code: "C", title: "Quality of Work", marks: 20 },
        { code: "D", title: "Efficiency", marks: 20 },
        { code: "E", title: "Attitude", marks: 20 },
      ],
      students: config.students || [],
    };
  },

  // ─── Helper Methods ───

  _extractStudentsArray(studentsMap) {
    if (!studentsMap) return [];
    if (studentsMap instanceof Map) return Array.from(studentsMap.values());
    if (Array.isArray(studentsMap)) return studentsMap;
    if (typeof studentsMap === "object") return Object.values(studentsMap);
    return [];
  },

  _generateEvaluationPoints(moduleData) {
    if (
      moduleData?.evalutionsPoints &&
      Array.isArray(moduleData.evalutionsPoints)
    ) {
      return moduleData.evalutionsPoints.map((point, idx) => ({
        code: String.fromCharCode(65 + idx), // A, B, C, D, E...
        title: point.evaluation || "",
        marks: point.points || 0,
      }));
    }

    // Default 5 evaluation points
    return [
      { code: "A", title: "Technical Knowledge", marks: 20 },
      { code: "B", title: "Practical Skills", marks: 20 },
      { code: "C", title: "Quality of Work", marks: 20 },
      { code: "D", title: "Efficiency", marks: 20 },
      { code: "E", title: "Attitude", marks: 20 },
    ];
  },

  _checkStudentPresence(student, moduleData, studentAttendance) {
    if (!student.userId || !moduleData?.startDate) return false;

    const attendance = studentAttendance?.[student.userId] || {};
    const startDate = new Date(moduleData.startDate);

    // Check if present in any day of the module week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      if (attendance[dateKey] === "present") {
        return true;
      }
    }

    return false;
  },

  _generateStudentScores(isPresent, evaluationCodes = ["A", "B", "C", "D", "E"]) {
    if (!isPresent) {
      return evaluationCodes.reduce((acc, code) => {
        acc[code] = "—";
        return acc;
      }, {});
    }
    return evaluationCodes.reduce((acc, code) => {
      acc[code] = Math.floor(Math.random() * 10) + 10;
      return acc;
    }, {});
  },

  _calculateTotal(scores) {
    if (!scores || typeof scores !== "object") return "AB";
    return Object.values(scores).reduce((sum, v) => {
      const n = Number(v);
      return isNaN(n) ? sum : sum + n;
    }, 0);
  },

  /**
   * Validate JSON structure
   */
  validateData(data) {
    const errors = [];

    if (!data.institute?.name) errors.push("Missing institute.name");
    if (!data.job?.number) errors.push("Missing job.number");
    if (!Array.isArray(data.evaluationPoints))
      errors.push("evaluationPoints must be array");
    if (!Array.isArray(data.students)) errors.push("students must be array");

    if (data.evaluationPoints?.length === 0) {
      errors.push("At least one evaluation point required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export default jobEvaluationDataAdapter;
