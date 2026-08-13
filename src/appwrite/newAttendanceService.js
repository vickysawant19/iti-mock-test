import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";
import userStatsService from "./userStats";
import { attendanceAnalyticsService } from "@/services/attendanceAnalyticsService";
import { attendanceTrackingService } from "@/services/attendanceTrackingService";

class NewAttendanceService {
  constructor() {
    this.database = appwriteService.getTablesDB();
  }

  // Fetch all documents using pagination (handles documents.total automatically with max 5000 page size)
  async fetchAllDocuments(queries = []) {
    try {
      const limit = 5000;

      // Fetch first page with max limit
      const firstResponse = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,
        queries: [...queries, Query.limit(limit), Query.offset(0)]
      });

      const total = firstResponse.total;
      const allDocuments = [...firstResponse.rows];

      // If all documents fetched in first call, return early
      if (firstResponse.rows.length >= total) {
        return { documents: allDocuments, total };
      }

      // Calculate remaining pages needed
      const remainingPages = Math.ceil((total - limit) / limit);

      // Create promises for remaining pages
      const fetchPromises = Array.from({ length: remainingPages }, (_, i) =>
        this.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.newAttendanceCollectionId,
          queries: [...queries, Query.limit(limit), Query.offset((i + 1) * limit)]
        }),
      );

      // Fetch all remaining pages concurrently
      const responses = await Promise.all(fetchPromises);

      // Add remaining documents
      responses.forEach((response) => {
        allDocuments.push(...response.rows);
      });

      return {
        documents: allDocuments,
        total: allDocuments.length,
      };
    } catch (error) {
      throw error;
    }
  }
  // Get student attendance
  async getStudentAttendance(userId, batchId, additionalQueries = []) {
    if (!batchId) return [];
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.orderDesc("date"),
        ...additionalQueries
      ];

      const result = (await this.fetchAllDocuments(queries)).documents;

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get student attendance for a specific date range
  async getStudentAttendanceByDateRange(
    userId,
    batchId,
    startDate,
    endDate,
    additionalQueries = [],
  ) {
    if (!batchId) return { documents: [], total: 0 };
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.greaterThanEqual("date", this.formatDate(startDate)),
        Query.lessThanEqual("date", this.formatDate(endDate)),
        Query.orderDesc("date"),
      ];
      additionalQueries.length !== 0 && queries.push(...additionalQueries);
      return await this.fetchAllDocuments(queries);
    } catch (error) {
      throw error;
    }
  }

  /** Teacher's own attendance in a range (`userId` in collection === teacherId). */
  async getTeacherAttendanceByDateRange(
    teacherId,
    batchId,
    startDate,
    endDate,
    additionalQueries = [],
  ) {
    return this.getStudentAttendanceByDateRange(
      teacherId,
      batchId,
      startDate,
      endDate,
      additionalQueries,
    );
  }

  // Get attendance for a specific date
  async getAttendanceByDate(userId, batchId, date) {
    if (!batchId) return null;
    try {
      const data = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,

        queries: [
          Query.equal("userId", userId),
          Query.equal("batchId", batchId),
          Query.equal("date", this.formatDate(date)),
          Query.limit(1),
        ]
      });
      return data.rows.length > 0 ? data.rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get batch attendance for a specific date (all students)
  async getBatchAttendanceByDate(batchId, date, extraQueries = []) {
    if (!batchId) return { documents: [], total: 0 };
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.equal("date", this.formatDate(date)),
      ];
      extraQueries.length !== 0 && queries.push(...extraQueries);

      return await this.fetchAllDocuments(queries);
    } catch (error) {
      throw error;
    }
  }

  // Get batch attendance with pagination (for UI with infinite scroll)
  async getBatchAttendance(batchId, limit = 100, offset = 0) {
    if (!batchId) return { documents: [], total: 0 };
    try {
      const data = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,

        queries: [
          Query.equal("batchId", batchId),
          Query.orderDesc("date"),
          Query.limit(limit),
          Query.offset(offset),
        ]
      });
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get all batch attendance (fetch all pages)
  async getAllBatchAttendance(batchId, customQueries = []) {
    if (!batchId) return { documents: [], total: 0 };
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.orderDesc("date"),
        ...customQueries,
      ];

      return await this.fetchAllDocuments(queries);
    } catch (error) {
      throw error;
    }
  }

  // Get attendance by trade
  async getTradeAttendance(tradeId, startDate = null, endDate = null) {
    try {
      const queries = [
        Query.equal("tradeId", tradeId),
        Query.orderDesc("date"),
      ];

      if (startDate) {
        queries.push(
          Query.greaterThanEqual("date", this.formatDate(startDate)),
        );
      }
      if (endDate) {
        queries.push(Query.lessThanEqual("date", this.formatDate(endDate)));
      }

      return await this.fetchAllDocuments(queries);
    } catch (error) {
      throw error;
    }
  }

  // Get attendance by status
  async getAttendanceByStatus(
    batchId,
    status,
    startDate = null,
    endDate = null,
  ) {
    if (!batchId) return { documents: [], total: 0 };
    try {
      const upperStatus = String(status || "").toUpperCase();
      const queries = [
        Query.equal("batchId", batchId),
        Query.equal("dayType", "WORKING"),
        Query.equal("attendanceStatus", upperStatus),
      ];

      if (startDate) {
        queries.push(
          Query.greaterThanEqual("date", this.formatDate(startDate)),
        );
      }
      if (endDate) {
        queries.push(Query.lessThanEqual("date", this.formatDate(endDate)));
      }

      queries.push(Query.orderDesc("date"));

      return await this.fetchAllDocuments(queries);
    } catch (error) {
      throw error;
    }
  }

  // Create single attendance record
  async createAttendance(
    {
      userId,
      batchId,
      tradeId,
      date,
      status,
      remarks,
      markedAt,
      markedBy,
      dayType,
      attendanceStatus,
      leaveType,
      source,
      holidayId,
    },
    skipStats = false
  ) {
    try {
      // Ensure date is in YYYY-MM-DD format (10 characters)
      const formattedDate = this.formatDate(date);
      const functions = appwriteService.getFunctions();
      const payload = JSON.stringify({
        action: "createAttendance",
        userId,
        batchId,
        tradeId,
        date: formattedDate,
        status: status || (attendanceStatus ? attendanceStatus.toLowerCase() : "present"),
        remarks,
        markedAt: markedAt || new Date().toISOString(),
        markedBy,
        dayType: dayType || "WORKING",
        attendanceStatus: attendanceStatus || (status ? status.toUpperCase() : "PRESENT"),
        leaveType: leaveType || null,
        source: source || "MANUAL",
        holidayId: holidayId || null,
      });

      const response = await functions.createExecution(
        conf.userManageFunctionId,
        payload,
        false
      );

      const resData = JSON.parse(response.responseBody || "{}");
      if (!resData.success) {
        throw new Error(resData.error || "Failed to create attendance");
      }

      return resData.data;
    } catch (error) {
      throw error;
    }
  }

  // Create multiple attendance records via cloud function using Bulk API
  async createMultipleAttendance(attendanceRecords) {
    try {
      const functions = appwriteService.getFunctions();
      const payload = JSON.stringify({
        action: "createMultipleAttendance",
        attendanceRecords
      });

      const response = await functions.createExecution(
        conf.userManageFunctionId,
        payload,
        false
      );
      
      const resData = JSON.parse(response.responseBody);
      if (!resData.success) {
        throw new Error(resData.error || "Failed to create multiple attendance");
      }

      return resData.data;
    } catch (error) {
      throw error;
    }
  }

  // Update attendance record
  async updateAttendance(documentId, updates) {
    try {
      // Format date if it exists in updates
      if (updates.date) {
        updates.date = this.formatDate(updates.date);
      }

      if (updates.status && !updates.attendanceStatus) {
        const { attendanceStatus, leaveType } = attendanceTrackingService.resolveStatusPair(updates.status, updates.leaveType);
        if (attendanceStatus) {
          updates.attendanceStatus = attendanceStatus;
          updates.leaveType = leaveType || null;
        } else {
          updates.attendanceStatus = String(updates.status).toUpperCase();
        }
      } else if (updates.attendanceStatus && !updates.status) {
        updates.status = String(updates.attendanceStatus).toLowerCase();
      }

      const functions = appwriteService.getFunctions();
      const payload = JSON.stringify({
        action: "updateAttendance",
        documentId,
        updates
      });

      const response = await functions.createExecution(
        conf.userManageFunctionId,
        payload,
        false
      );

      const resData = JSON.parse(response.responseBody);
      if (!resData.success) {
        throw new Error(resData.error || "Failed to update attendance");
      }

      return resData.data;
    } catch (error) {
      throw error;
    }
  }

  // Update attendance status
  async updateAttendanceStatus(documentId, status, remarks = null) {
    try {
      const updates = { status };
      if (remarks !== null) {
        updates.remarks = remarks;
      }
      return await this.updateAttendance(documentId, updates);
    } catch (error) {
      throw error;
    }
  }

  // Delete attendance record
  async deleteAttendance(documentId) {
    try {
      const functions = appwriteService.getFunctions();
      const payload = JSON.stringify({
        action: "deleteAttendance",
        documentId
      });

      const response = await functions.createExecution(
        conf.userManageFunctionId,
        payload,
        false
      );

      const resData = JSON.parse(response.responseBody);
      if (!resData.success) {
        throw new Error(resData.error || "Failed to delete attendance");
      }

      return documentId;
    } catch (error) {
      throw error;
    }
  }

  async deleteMultipleAttendance(documentIds) {
    try {
      if (!documentIds || documentIds.length === 0) {
        return []; // Nothing to delete, return empty array immediately
      }

      // Fetch records before deleting to get userId and batchId
      const recordsToQuery = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,
        queries: [Query.equal("$id", documentIds), Query.limit(100)]
      }).then(res => res.rows || []).catch(() => []);

      const functions = appwriteService.getFunctions();
      const payload = JSON.stringify({
        action: "deleteMultipleAttendance",
        documentIds
      });

      const response = await functions.createExecution(
        conf.userManageFunctionId,
        payload,
        false
      );
      
      const resData = JSON.parse(response.responseBody);
      if (!resData.success) {
        throw new Error(resData.error || "Failed to delete multiple attendance");
      }

      return resData.data.deletedIds;
    } catch (error) {
      console.error("Error in deleteMultipleAttendance:", error);
      throw error;
    }
  }

  // Get attendance statistics for a student (Fast pre-aggregated query from monthlyAttendanceStats)
  async getStudentAttendanceStats(
    userId,
    batchId,
    startDate = null,
    endDate = null,
  ) {
    if (!userId || !batchId) return { total: 0, presentDays: 0, absentDays: 0, lateDays: 0, workingDays: 0, percentage: 0 };
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.limit(100),
      ];

      if (startDate) {
        const startMonth = String(startDate).substring(0, 7);
        queries.push(Query.greaterThanEqual("yearMonth", startMonth));
      }
      if (endDate) {
        const endMonth = String(endDate).substring(0, 7);
        queries.push(Query.lessThanEqual("yearMonth", endMonth));
      }

      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
        queries,
      });

      if (!response.rows || response.rows.length === 0) {
        // Fallback to daily documents calculation if no monthly stats row exists yet
        const baseQueries = [
          Query.equal("userId", userId),
          Query.equal("batchId", batchId),
          Query.select(["$id", "userId", "date", "status", "attendanceStatus", "leaveType", "dayType"]),
        ];
        if (startDate) baseQueries.push(Query.greaterThanEqual("date", this.formatDate(startDate)));
        if (endDate) baseQueries.push(Query.lessThanEqual("date", this.formatDate(endDate)));

        const attendanceDocs = await this.fetchAllDocuments(baseQueries);
        const computed = attendanceAnalyticsService.computeStats({
          records: attendanceDocs.documents,
          startDate,
          endDate,
        });

        return {
          total: computed.workingDays || attendanceDocs.total,
          presentDays: computed.presentDays,
          absentDays: computed.absentDays,
          lateDays: computed.lateDays,
          workingDays: computed.workingDays,
          holidayDays: computed.holidayDays,
          leaveDays: computed.leaveDays,
          leaveBreakdown: computed.leaveBreakdown,
          percentage: computed.attendancePercentage,
        };
      }

      let workingDays = 0, presentDays = 0, absentDays = 0;
      let casualLeaves = 0, sickLeaves = 0, specialLeaves = 0, onDutyLeaves = 0;
      let halfDays = 0, lateDays = 0, totalPresent = 0;

      response.rows.forEach((row) => {
        workingDays += (row.workingDays || 0);
        presentDays += (row.presentDays || 0);
        absentDays += (row.absentDays || 0);
        casualLeaves += (row.casualLeaves || 0);
        sickLeaves += (row.sickLeaves || 0);
        specialLeaves += (row.specialLeaves || 0);
        onDutyLeaves += (row.onDutyLeaves || 0);
        halfDays += (row.halfDays || 0);
        lateDays += (row.lateDays || 0);
        totalPresent += (row.totalPresent || 0);
      });

      const percentage = workingDays > 0 ? parseFloat(((totalPresent / workingDays) * 100).toFixed(1)) : 0;

      return {
        total: workingDays,
        workingDays,
        presentDays: totalPresent,
        rawPresentDays: presentDays,
        absentDays,
        casualLeaves,
        sickLeaves,
        specialLeaves,
        onDutyLeaves,
        halfDays,
        lateDays,
        leaveDays: casualLeaves + sickLeaves + specialLeaves + onDutyLeaves,
        leaveBreakdown: {
          CASUAL: casualLeaves,
          SICK: sickLeaves,
          SPECIAL: specialLeaves,
          ON_DUTY: onDutyLeaves,
        },
        percentage,
      };
    } catch (error) {
      console.error("[newAttendanceService] getStudentAttendanceStats error:", error);
      throw error;
    }
  }

  // Utility to chunk arrays into optimal batch sizes (default 25 IDs per query)
  chunkArray(array, size = 25) {
    if (!Array.isArray(array)) return [];
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async getBatchPresentCountsForStudents(studentIds, batchId, startDate = null, endDate = null) {
    if (!batchId || !studentIds?.length) return {};
    try {
      const studentChunks = this.chunkArray(studentIds, 25);

      const chunkResults = await Promise.all(
        studentChunks.map(async (chunk) => {
          const queries = [
            Query.equal("batchId", batchId),
            Query.equal("userId", chunk),
            Query.select(["$id", "userId", "status", "attendanceStatus", "leaveType", "dayType"]),
          ];
          if (startDate) queries.push(Query.greaterThanEqual("date", this.formatDate(startDate)));
          if (endDate)   queries.push(Query.lessThanEqual("date", this.formatDate(endDate)));

          return this.fetchAllDocuments(queries);
        })
      );

      const counts = {};
      (studentIds || []).forEach((sid) => {
        counts[sid] = {
          presentDays: 0,
          absentDays: 0,
          clDays: 0,
          slDays: 0,
          splDays: 0,
          odDays: 0,
          leaveDays: 0,
        };
      });

      chunkResults.forEach((res) => {
        (res.documents || []).forEach((row) => {
          const sid = row.userId;
          if (!sid || !counts[sid]) return;

          const dayType = (row.dayType || "").toUpperCase();
          if (dayType === "HOLIDAY") return;

          const status = String(row.attendanceStatus || row.status || "").toLowerCase();

          if (status === "present" || status === "p") {
            counts[sid].presentDays += 1;
          } else if (status === "absent" || status === "a") {
            counts[sid].absentDays += 1;
          } else if (status === "casual" || status === "cl") {
            counts[sid].clDays += 1;
            counts[sid].leaveDays += 1;
            counts[sid].presentDays += 1;
          } else if (status === "sick" || status === "sl") {
            counts[sid].slDays += 1;
            counts[sid].leaveDays += 1;
            counts[sid].presentDays += 1;
          } else if (status === "special" || status === "spl") {
            counts[sid].splDays += 1;
            counts[sid].leaveDays += 1;
            counts[sid].presentDays += 1;
          } else if (status === "on_duty" || status === "od") {
            counts[sid].odDays += 1;
            counts[sid].leaveDays += 1;
            counts[sid].presentDays += 1;
          }
        });
      });

      return counts;
    } catch (error) {
      console.error("[newAttendanceService] getBatchPresentCountsForStudents error:", error);
      return {};
    }
  }

  // Optimized Batch Student Stats: Fetches batch attendance in parallel chunks of 25 students & computes per-student stats in memory
  async getBatchCumulativeStudentStats(studentIds, batchId, startDate = null, endDate = null) {
    if (!batchId || !studentIds?.length) return new Map();
    try {
      const studentChunks = this.chunkArray(studentIds, 25);

      const chunkResponses = await Promise.all(
        studentChunks.map(async (chunk) => {
          const baseQueries = [
            Query.equal("batchId", batchId),
            Query.equal("userId", chunk),
            Query.select(["$id", "userId", "date", "status", "attendanceStatus", "leaveType", "dayType"]),
          ];

          if (startDate) {
            baseQueries.push(Query.greaterThanEqual("date", this.formatDate(startDate)));
          }
          if (endDate) {
            baseQueries.push(Query.lessThanEqual("date", this.formatDate(endDate)));
          }

          return this.fetchAllDocuments(baseQueries);
        })
      );

      const userRecordsMap = new Map();
      (studentIds || []).forEach((id) => userRecordsMap.set(id, []));

      chunkResponses.forEach((res) => {
        (res.documents || []).forEach((doc) => {
          if (doc.userId && userRecordsMap.has(doc.userId)) {
            userRecordsMap.get(doc.userId).push(doc);
          }
        });
      });

      const resultMap = new Map();
      userRecordsMap.forEach((userDocs, userId) => {
        const computed = attendanceAnalyticsService.computeStats({
          records: userDocs,
          startDate,
          endDate,
        });

        resultMap.set(userId, {
          total: computed.workingDays,
          presentDays: computed.presentDays,
          absentDays: computed.absentDays,
          lateDays: computed.lateDays,
          workingDays: computed.workingDays,
          holidayDays: computed.holidayDays,
          leaveDays: computed.leaveDays,
          leaveBreakdown: computed.leaveBreakdown,
          percentage: computed.attendancePercentage,
        });
      });

      return resultMap;
    } catch (error) {
      console.error("[newAttendanceService] getBatchCumulativeStudentStats error:", error);
      return new Map();
    }
  }

  // Get batch attendance statistics for a specific date
  async getBatchAttendanceStats(batchId, date) {
    if (!batchId) return { total: 0, present: 0, absent: 0, late: 0, holiday: 0, percentage: 0 };
    try {
      const formattedDate = this.formatDate(date);

      const queries = [
        Query.equal("batchId", batchId),
        Query.equal("date", formattedDate),
      ];

      const data = await this.fetchAllDocuments(queries);
      const computed = attendanceAnalyticsService.computeStats({ records: data.documents });

      return {
        total: computed.workingDays || data.total,
        workingDays: computed.workingDays,
        present: computed.presentDays,
        absent: computed.absentDays,
        late: computed.lateDays,
        holiday: computed.holidayDays,
        leave: computed.leaveDays,
        leaveBreakdown: computed.leaveBreakdown,
        percentage: computed.attendancePercentage,
      };
    } catch (error) {
      throw error;
    }
  }

  // Mark batch attendance via cloud function using Bulk API
  async markBatchAttendance(batchId, date, attendanceData) {
    if (!batchId) return { success: [], errors: [], total: 0, created: 0, updated: 0, failed: 0 };
    try {
      const formattedDate = this.formatDate(date);

      // Validate input
      if (!attendanceData || attendanceData.length === 0) {
        return {
          success: [],
          errors: [],
          total: 0,
          created: 0,
          updated: 0,
          failed: 0,
        };
      }

      const functions = appwriteService.getFunctions();
      const payload = JSON.stringify({
        action: "markBatchAttendance",
        batchId,
        date: formattedDate,
        attendanceData
      });

      const response = await functions.createExecution(
        conf.userManageFunctionId,
        payload,
        false
      );

      const resData = JSON.parse(response.responseBody);
      if (!resData.success) {
        throw new Error(resData.error || "Failed to mark batch attendance");
      }

      return resData.data;
    } catch (error) {
      console.error("markBatchAttendance error:", error);
      throw new Error(`Failed to mark batch attendance: ${error.message}`);
    }
  }

  // Get monthly attendance summary
  async getMonthlyAttendance(userId, batchId, year, month) {
    if (!batchId) return { documents: [], total: 0 };
    try {
      // Format dates as YYYY-MM-DD (10 characters)
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
        lastDay,
      ).padStart(2, "0")}`;

      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
        Query.orderAsc("date"),
      ];

      return await this.fetchAllDocuments(queries);
    } catch (error) {
      throw error;
    }
  }

  // Get direct count for student attendance
  async getStudentAttendanceCount(
    userId,
    batchId,
    status,
    startDate = null,
    endDate = null
  ) {
    if (!userId || !batchId || !status) return 0;
    try {
      const upperStatus = String(status || "").toUpperCase();
      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.equal("dayType", "WORKING"),
        Query.equal("attendanceStatus", upperStatus),
        Query.limit(1)
      ];

      if (startDate) {
        queries.push(Query.greaterThanEqual("date", this.formatDate(startDate)));
      }
      if (endDate) {
        queries.push(Query.lessThanEqual("date", this.formatDate(endDate)));
      }

      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,
        queries
      });
      
      return response.total;
    } catch (error) {
      console.error("Error fetching attendance count:", error);
      return 0;
    }
  }

  // Get students with low attendance
  async getLowAttendanceStudents(batchId, startDate, endDate, threshold = 75) {
    if (!batchId) return [];
    try {
      const queries = [Query.equal("batchId", batchId)];

      if (startDate) {
        queries.push(
          Query.greaterThanEqual("date", this.formatDate(startDate)),
        );
      }
      if (endDate) {
        queries.push(Query.lessThanEqual("date", this.formatDate(endDate)));
      }

      const data = await this.fetchAllDocuments(queries);

      // Group by userId
      const userAttendance = {};
      data.documents.forEach((doc) => {
        if (!userAttendance[doc.userId]) {
          userAttendance[doc.userId] = {
            userId: doc.userId,
            total: 0,
            present: 0,
            late: 0,
            absent: 0,
            holiday: 0,
          };
        }

        userAttendance[doc.userId].total++;
        const st = String(doc.attendanceStatus || doc.status || "").toLowerCase();
        const dt = String(doc.dayType || "").toUpperCase();
        if (st === "present") userAttendance[doc.userId].present++;
        else if (st === "late") userAttendance[doc.userId].late++;
        else if (st === "absent") userAttendance[doc.userId].absent++;
        if (dt === "HOLIDAY" || st === "holiday") userAttendance[doc.userId].holiday++;
      });

      // Calculate percentage and filter
      const lowAttendanceStudents = Object.values(userAttendance)
        .map((student) => {
          const workingDays = student.total - student.holiday;
          const percentage =
            workingDays > 0
              ? parseFloat(
                  (
                    ((student.present + student.late) / workingDays) *
                    100
                  ).toFixed(2),
                )
              : 0;
          return { ...student, percentage, workingDays };
        })
        .filter((student) => student.percentage < threshold)
        .sort((a, b) => a.percentage - b.percentage);

      return lowAttendanceStudents;
    } catch (error) {
      throw error;
    }
  }

  // Check if attendance exists
  async checkAttendanceExists(userId, batchId, date) {
    if (!batchId) return false;
    try {
      const formattedDate = this.formatDate(date);

      const data = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,

        queries: [
          Query.equal("userId", userId),
          Query.equal("batchId", batchId),
          Query.equal("date", formattedDate),
          Query.limit(1),
        ]
      });
      return data.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get distinct dates for a batch
  async getBatchAttendanceDates(batchId, limit = 30) {
    if (!batchId) return [];
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.orderDesc("date"),
      ];

      const data = await this.fetchAllDocuments(queries);

      // Get unique dates
      const dates = [...new Set(data.documents.map((doc) => doc.date))].slice(
        0,
        limit,
      );
      return dates;
    } catch (error) {
      throw error;
    }
  }

  // Get attendance count by date range
  async getAttendanceCountByDateRange(
    batchId,
    startDate,
    endDate,
    status = null,
  ) {
    if (!batchId) return 0;
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.greaterThanEqual("date", this.formatDate(startDate)),
        Query.lessThanEqual("date", this.formatDate(endDate)),
      ];

      if (status) {
        queries.push(Query.equal("status", status));
      }

      const data = await this.fetchAllDocuments(queries);
      return data.total;
    } catch (error) {
      throw error;
    }
  }

  async getBatchStatsByDate(batchIds, studentIds, date) {
    try {
      const formattedDate = this.formatDate(date);

      // 1. Create an array of promises (requests run in parallel)
      const statsPromises = batchIds.map(async (batchId) => {
        const batchStudents = studentIds[batchId] || [];

        const queryParams = [
          Query.equal("batchId", batchId),
          Query.equal("date", formattedDate),
          Query.select(["userId", "status"]),
        ];

        // Only add the userId filter if valid students exist
        if (batchStudents.length > 0) {
          queryParams.push(Query.equal("userId", batchStudents));
        }

        // 2. Single API Call: Fetch ALL records for this batch/date
        const response = await this.fetchAllDocuments(queryParams);

        // 3. Calculate Stats in Memory (JavaScript is faster than a 2nd Network Request)
        const documents = response.documents;

        const presentCount = documents.filter(
          (doc) => (doc.attendanceStatus ? doc.attendanceStatus.toLowerCase() : doc.status) === "present",
        ).length;
        const absentCount = documents.filter(
          (doc) => (doc.attendanceStatus ? doc.attendanceStatus.toLowerCase() : doc.status) === "absent",
        ).length;

        const totalMarked = presentCount + absentCount;

        // Calculate Percentage
        const percentage =
          totalMarked > 0
            ? parseFloat(((presentCount / totalMarked) * 100).toFixed(2))
            : 0;

        return {
          batchId,
          stats: {
            total: totalMarked,
            present: presentCount,
            absent: absentCount,
            holiday: 0,
            percentage: percentage,
          },
        };
      });

      // 4. Wait for all requests to finish simultaneously
      const results = await Promise.all(statsPromises);

      // 5. Convert array back to object format: { batchId: { ...stats } }
      const finalStats = results.reduce((acc, item) => {
        acc[item.batchId] = item.stats;
        return acc;
      }, {});

      return finalStats;
    } catch (error) {
      console.error("Error fetching batch stats:", error);
      throw error;
    }
  }

  // Utility: Format date to YYYY-MM-DD (10 characters)
  formatDate(date) {
    if (!date) return null;
    // If already in correct format
    if (
      typeof date === "string" &&
      date.length === 10 &&
      date.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      return date;
    }

    // If Date object or other format, convert
    const dateObj = date instanceof Date ? date : new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // Utility: Get today's date in YYYY-MM-DD format
  getTodayDate() {
    return this.formatDate(new Date());
  }

  // Utility: Get date range for current month
  getCurrentMonthRange() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
      lastDay,
    ).padStart(2, "0")}`;

    return { startDate, endDate, year, month };
  }

  /**
   * Recalculate and upsert monthly pre-aggregated attendance stats for a single (userId, batchId, yearMonth).
   * Document ID in monthlyAttendanceStats: `${userId}_${batchId}_${yearMonth}`
   */
  async syncMonthlyAttendanceStats(userId, batchId, dateStr, enrollmentDate = null) {
    if (!userId || !batchId || !dateStr) return null;
    const yearMonth = String(dateStr).substring(0, 7); // "YYYY-MM"
    const docId = `${userId}_${batchId}_${yearMonth}`;

    try {
      let enrollDate = enrollmentDate;
      if (!enrollDate) {
        try {
          const bsRes = await this.database.listRows({
            databaseId: conf.databaseId,
            tableId: conf.batchStudentsCollectionId,
            queries: [
              Query.equal("batchId", batchId),
              Query.equal("studentId", userId),
              Query.limit(1),
            ],
          });
          enrollDate = bsRes.rows?.[0]?.enrollmentDate || bsRes.rows?.[0]?.joinedAt || null;
        } catch { /* ignore */ }
      }

      const enrollStr = enrollDate ? String(enrollDate).substring(0, 10) : null;

      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.startsWith("date", yearMonth),
        Query.limit(35),
      ];

      if (enrollStr && enrollStr.substring(0, 7) === yearMonth) {
        queries.push(Query.greaterThanEqual("date", enrollStr));
      }

      // 1. Fetch daily rows for this user + batch in target month
      const monthRecords = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,
        queries,
      });

      let presentDays = 0;
      let absentDays = 0;
      let casualLeaves = 0;
      let sickLeaves = 0;
      let specialLeaves = 0;
      let onDutyLeaves = 0;
      let halfDays = 0;
      let lateDays = 0;

      (monthRecords.rows || []).forEach((row) => {
        const s = String(row.status || row.attendanceStatus || "").toLowerCase();
        if (s === "present" || s === "p") presentDays++;
        else if (s === "absent" || s === "a") absentDays++;
        else if (s === "casual" || s === "cl") casualLeaves++;
        else if (s === "sick" || s === "sl") sickLeaves++;
        else if (s === "special" || s === "spl") specialLeaves++;
        else if (s === "on_duty" || s === "od") onDutyLeaves++;
        else if (s === "half_day" || s === "hd") halfDays++;
        else if (s === "late" || s === "l") lateDays++;
      });

      const totalPresent = presentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves;
      const workingDays = presentDays + absentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves + halfDays + lateDays;
      const attendancePercentage = workingDays > 0 ? parseFloat(((totalPresent / workingDays) * 100).toFixed(1)) : 0;

      const payload = {
        userId,
        batchId,
        yearMonth,
        workingDays,
        presentDays,
        absentDays,
        casualLeaves,
        sickLeaves,
        specialLeaves,
        onDutyLeaves,
        halfDays,
        lateDays,
        totalPresent,
        attendancePercentage,
        updatedAt: new Date().toISOString(),
      };

      try {
        return await this.database.updateRow({
          databaseId: conf.databaseId,
          tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
          rowId: docId,
          data: payload,
        });
      } catch (err) {
        return await this.database.createRow({
          databaseId: conf.databaseId,
          tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
          rowId: docId,
          data: payload,
        });
      }
    } catch (error) {
      console.error("[newAttendanceService] Failed to sync monthly attendance stats:", error);
      return null;
    }
  }

  /**
   * Silent background verification & auto-correction feature.
   * Compares pre-aggregated `monthlyAttendanceStats` documents against actual daily attendance records
   * for all students in a batch for a target month (`yearMonth`).
   * Automatically auto-corrects any discrepancies in `monthlyAttendanceStats` silently in the background.
   */
  async verifyBatchMonthlyStats(batchId, yearMonth, studentsList = []) {
    if (!batchId || !yearMonth) return { total: 0, verifiedCount: 0, correctedCount: 0 };
    try {
      let students = studentsList;
      if (!students || students.length === 0) {
        const bsRes = await this.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.batchStudentsCollectionId,
          queries: [Query.equal("batchId", batchId), Query.limit(500)],
        });
        students = (bsRes.rows || []).map((row) => ({
          userId: row.studentId,
          enrollmentDate: row.enrollmentDate || row.joinedAt,
        }));
      }

      const existingStatsMap = await this.getBatchMonthlyStats(batchId, yearMonth);

      let correctedCount = 0;
      let verifiedCount = 0;
      const correctedDetails = [];

      for (const student of students) {
        if (!student?.userId || student.isTeacher) continue;

        const uid = student.userId;
        const enrollDate = student.enrollmentDate;
        const enrollStr = enrollDate ? String(enrollDate).substring(0, 10) : null;

        const queries = [
          Query.equal("userId", uid),
          Query.equal("batchId", batchId),
          Query.startsWith("date", yearMonth),
          Query.limit(35),
        ];

        if (enrollStr && enrollStr.substring(0, 7) === yearMonth) {
          queries.push(Query.greaterThanEqual("date", enrollStr));
        }

        const monthRecords = await this.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.newAttendanceCollectionId,
          queries,
        });

        let presentDays = 0;
        let absentDays = 0;
        let casualLeaves = 0;
        let sickLeaves = 0;
        let specialLeaves = 0;
        let onDutyLeaves = 0;
        let halfDays = 0;
        let lateDays = 0;

        (monthRecords.rows || []).forEach((row) => {
          const s = String(row.status || row.attendanceStatus || "").toLowerCase();
          if (s === "present" || s === "p") presentDays++;
          else if (s === "absent" || s === "a") absentDays++;
          else if (s === "casual" || s === "cl") casualLeaves++;
          else if (s === "sick" || s === "sl") sickLeaves++;
          else if (s === "special" || s === "spl") specialLeaves++;
          else if (s === "on_duty" || s === "od") onDutyLeaves++;
          else if (s === "half_day" || s === "hd") halfDays++;
          else if (s === "late" || s === "l") lateDays++;
        });

        const totalPresent = presentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves;
        const workingDays = presentDays + absentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves + halfDays + lateDays;
        const attendancePercentage = workingDays > 0 ? parseFloat(((totalPresent / workingDays) * 100).toFixed(1)) : 0;

        const storedDoc = existingStatsMap.get(uid);

        const isMismatch =
          !storedDoc ||
          storedDoc.workingDays !== workingDays ||
          storedDoc.presentDays !== presentDays ||
          storedDoc.absentDays !== absentDays ||
          storedDoc.totalPresent !== totalPresent ||
          storedDoc.attendancePercentage !== attendancePercentage;

        if (isMismatch) {
          await this.syncMonthlyAttendanceStats(uid, batchId, `${yearMonth}-01`, enrollDate);
          correctedCount++;
          correctedDetails.push({ userId: uid, workingDays, totalPresent, percentage: attendancePercentage });
        } else {
          verifiedCount++;
        }
      }

      if (correctedCount > 0) {
        console.log(
          `[Silent Stats Verifier] Batch ${batchId} (${yearMonth}): Verified ${verifiedCount} students, auto-corrected ${correctedCount} monthly stats docs.`
        );
      }

      return { total: students.length, verifiedCount, correctedCount, correctedDetails };
    } catch (error) {
      console.error("[Silent Stats Verifier] Error during verification:", error);
      return { total: 0, verifiedCount: 0, correctedCount: 0 };
    }
  }


  /**
   * Get pre-aggregated monthly stats for all students in a batch in 1 single fast query.
   * Returns a Map: userId => monthlyStatsObject
   */
  async getBatchMonthlyStats(batchId, yearMonth) {
    if (!batchId || !yearMonth) return new Map();
    try {
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("yearMonth", yearMonth),
          Query.limit(500),
          Query.select([
            "userId", "batchId", "yearMonth", "workingDays", "presentDays", "absentDays",
            "casualLeaves", "sickLeaves", "specialLeaves", "onDutyLeaves", "halfDays", "lateDays",
            "totalPresent", "attendancePercentage"
          ]),
        ],
      });

      const statsMap = new Map();
      (response.rows || []).forEach((doc) => {
        statsMap.set(doc.userId, doc);
      });
      return statsMap;
    } catch (error) {
      console.error("[newAttendanceService] Error fetching batch monthly stats:", error);
      return new Map();
    }
  }

  /**
   * Get cumulative pre-aggregated stats for a batch across past months in 1 fast query.
   * Returns a Map: userId => { workingDays, presentDays, absentDays, totalPresent, percentage }
   */
  async getBatchCumulativeMonthlyStats(batchId, beforeYearMonth) {
    if (!batchId) return new Map();
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.limit(1000),
        Query.select([
          "userId", "batchId", "yearMonth", "workingDays", "presentDays", "absentDays",
          "casualLeaves", "sickLeaves", "specialLeaves", "onDutyLeaves", "halfDays", "lateDays",
          "totalPresent", "attendancePercentage"
        ]),
      ];
      if (beforeYearMonth) {
        queries.push(Query.lessThan("yearMonth", beforeYearMonth));
      }

      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
        queries,
      });

      const cumulativeMap = new Map();

      (response.rows || []).forEach((row) => {
        const uid = row.userId;
        const current = cumulativeMap.get(uid) || {
          workingDays: 0,
          presentDays: 0,
          absentDays: 0,
          casualLeaves: 0,
          sickLeaves: 0,
          specialLeaves: 0,
          onDutyLeaves: 0,
          totalPresent: 0,
        };

        current.workingDays += (row.workingDays || 0);
        current.presentDays += (row.presentDays || 0);
        current.absentDays += (row.absentDays || 0);
        current.casualLeaves += (row.casualLeaves || 0);
        current.sickLeaves += (row.sickLeaves || 0);
        current.specialLeaves += (row.specialLeaves || 0);
        current.onDutyLeaves += (row.onDutyLeaves || 0);
        current.totalPresent += (row.totalPresent || 0);

        cumulativeMap.set(uid, current);
      });

      cumulativeMap.forEach((val) => {
        val.percentage = val.workingDays > 0 ? parseFloat(((val.totalPresent / val.workingDays) * 100).toFixed(1)) : 0;
      });

      return cumulativeMap;
    } catch (error) {
      console.error("[newAttendanceService] Error fetching cumulative monthly stats:", error);
      return new Map();
    }
  }

  /**
   * Backfill / Migrate historical daily attendance into monthlyAttendanceStats for a batch.
   */
  async backfillBatchMonthlyStats(batchId) {
    if (!batchId) return false;
    try {
      const allDailyDocs = await this.fetchAllDocuments([Query.equal("batchId", batchId)]);
      const userMonthGroupMap = new Map();

      (allDailyDocs.documents || []).forEach((doc) => {
        if (!doc.userId || !doc.date) return;
        const yearMonth = doc.date.substring(0, 7);
        const key = `${doc.userId}_${yearMonth}`;
        if (!userMonthGroupMap.has(key)) userMonthGroupMap.set(key, []);
        userMonthGroupMap.get(key).push(doc);
      });

      for (const [key, rows] of userMonthGroupMap.entries()) {
        const [userId, yearMonth] = key.split("_");
        const docId = `${userId}_${batchId}_${yearMonth}`;

        let presentDays = 0, absentDays = 0, casualLeaves = 0;
        let sickLeaves = 0, specialLeaves = 0, onDutyLeaves = 0, halfDays = 0, lateDays = 0;

        rows.forEach((r) => {
          const s = String(r.status || r.attendanceStatus || "").toLowerCase();
          if (s === "present" || s === "p") presentDays++;
          else if (s === "absent" || s === "a") absentDays++;
          else if (s === "casual" || s === "cl") casualLeaves++;
          else if (s === "sick" || s === "sl") sickLeaves++;
          else if (s === "special" || s === "spl") specialLeaves++;
          else if (s === "on_duty" || s === "od") onDutyLeaves++;
          else if (s === "half_day" || s === "hd") halfDays++;
          else if (s === "late" || s === "l") lateDays++;
        });

        const totalPresent = presentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves;
        const workingDays = presentDays + absentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves + halfDays + lateDays;
        const attendancePercentage = workingDays > 0 ? parseFloat(((totalPresent / workingDays) * 100).toFixed(1)) : 0;

        const payload = {
          userId,
          batchId,
          yearMonth,
          workingDays,
          presentDays,
          absentDays,
          casualLeaves,
          sickLeaves,
          specialLeaves,
          onDutyLeaves,
          halfDays,
          lateDays,
          totalPresent,
          attendancePercentage,
          updatedAt: new Date().toISOString(),
        };

        try {
          await this.database.updateRow({
            databaseId: conf.databaseId,
            tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
            rowId: docId,
            data: payload,
          });
        } catch (err) {
          await this.database.createRow({
            databaseId: conf.databaseId,
            tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
            rowId: docId,
            data: payload,
          });
        }
      }

      console.log(`[newAttendanceService] Successfully backfilled monthly stats for batch: ${batchId}`);
      return true;
    } catch (error) {
      console.error("[newAttendanceService] Failed to backfill batch monthly stats:", error);
      return false;
    }
  }

  /**
   * Trigger bulk migration of monthly attendance stats for ALL batches via user-manage function.
   */
  async triggerBulkMonthlyStatsMigration() {
    try {
      const functions = appwriteService.getFunctions();
      const payload = JSON.stringify({
        action: "migrateMonthlyStats",
      });

      const response = await functions.createExecution(
        conf.userManageFunctionId,
        payload,
        false
      );

      const resData = JSON.parse(response.responseBody);
      if (!resData.success) {
        throw new Error(resData.error || "Failed bulk migration of monthly stats");
      }

      return resData.data;
    } catch (error) {
      console.error("[newAttendanceService] Error triggering bulk monthly stats migration:", error);
      throw error;
    }
  }

  /**
   * Client-side bulk migration of monthly attendance stats for all batches.
   * Processes all rows in `newAttendance`, groups them by `${userId}_${batchId}_${yearMonth}`,
   * and upserts into `monthlyAttendanceStats`.
   */
  async backfillAllMonthlyAttendanceStats(onProgress) {
    try {
      if (onProgress) onProgress("Fetching all daily attendance records from Appwrite...");

      const allAttendanceRes = await this.fetchAllDocuments();
      const allDocs = allAttendanceRes.documents || [];

      if (onProgress) onProgress(`Fetched ${allDocs.length} total attendance records. Grouping by user, batch, and month...`);

      const groupMap = new Map();

      allDocs.forEach((doc) => {
        if (!doc.userId || !doc.batchId || !doc.date) return;
        const yearMonth = String(doc.date).substring(0, 7);
        const docId = `${doc.userId}_${doc.batchId}_${yearMonth}`;

        if (!groupMap.has(docId)) {
          groupMap.set(docId, {
            docId,
            userId: doc.userId,
            batchId: doc.batchId,
            yearMonth,
            rows: [],
          });
        }
        groupMap.get(docId).rows.push(doc);
      });

      if (onProgress) onProgress(`Grouped into ${groupMap.size} unique monthly user-batch summaries. Upserting monthlyAttendanceStats...`);

      let processed = 0;
      const total = groupMap.size;

      for (const group of groupMap.values()) {
        let presentDays = 0, absentDays = 0, casualLeaves = 0;
        let sickLeaves = 0, specialLeaves = 0, onDutyLeaves = 0, halfDays = 0, lateDays = 0;

        group.rows.forEach((r) => {
          const s = String(r.status || r.attendanceStatus || '').toLowerCase();
          if (s === 'present' || s === 'p') presentDays++;
          else if (s === 'absent' || s === 'a') absentDays++;
          else if (s === 'casual' || s === 'cl') casualLeaves++;
          else if (s === 'sick' || s === 'sl') sickLeaves++;
          else if (s === 'special' || s === 'spl') specialLeaves++;
          else if (s === 'on_duty' || s === 'od') onDutyLeaves++;
          else if (s === 'half_day' || s === 'hd') halfDays++;
          else if (s === 'late' || s === 'l') lateDays++;
        });

        const totalPresent = presentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves;
        const workingDays = presentDays + absentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves + halfDays + lateDays;
        const attendancePercentage = workingDays > 0 ? parseFloat(((totalPresent / workingDays) * 100).toFixed(1)) : 0;

        const payload = {
          userId: group.userId,
          batchId: group.batchId,
          yearMonth: group.yearMonth,
          workingDays,
          presentDays,
          absentDays,
          casualLeaves,
          sickLeaves,
          specialLeaves,
          onDutyLeaves,
          halfDays,
          lateDays,
          totalPresent,
          attendancePercentage,
          updatedAt: new Date().toISOString(),
        };

        try {
          await this.database.updateRow({
            databaseId: conf.databaseId,
            tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
            rowId: group.docId,
            data: payload,
          });
        } catch (e) {
          try {
            await this.database.createRow({
              databaseId: conf.databaseId,
              tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
              rowId: group.docId,
              data: payload,
            });
          } catch (err) {
            console.error(`Error saving monthly stats for ${group.docId}:`, err);
          }
        }

        processed++;
        if (onProgress && processed % 5 === 0) {
          onProgress(`Upserted ${processed} / ${total} monthly stats summaries...`);
        }
      }

      if (onProgress) onProgress(`Migration completed! Successfully processed ${total} monthly stats.`);
      return { success: true, count: total };
    } catch (error) {
      console.error("[newAttendanceService] Error in backfillAllMonthlyAttendanceStats:", error);
      throw error;
    }
  }
}

export const newAttendanceService = new NewAttendanceService();
