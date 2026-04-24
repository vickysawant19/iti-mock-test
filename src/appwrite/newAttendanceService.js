import { Query, ID } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";
import { format } from "date-fns";

class NewAttendanceService {
  constructor() {
    this.database = appwriteService.getTablesDB();
  }

  // Fetch all documents using pagination (handles documents.total automatically)
  async fetchAllDocuments(queries = []) {
    try {
      const limit = 100;

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
      const queries = [
        Query.equal("batchId", batchId),
        Query.equal("status", status),
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
  async createAttendance({
    userId,
    batchId,
    tradeId,
    date,
    status,
    remarks = null,
    markedAt = null,
    markedBy = null,
  }) {
    if (!batchId) return null;
    try {
      // Ensure date is in YYYY-MM-DD format (10 characters)
      const formattedDate = this.formatDate(date);
      const data = await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,
        rowId: ID.unique(),

        data: {
          userId,
          batchId,
          tradeId,
          date: formattedDate,
          status,
          remarks: remarks || null,
          markedAt: markedAt || new Date().toISOString(),
          markedBy: markedBy || null,
        }
      });
      return data;
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

      const data = await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,
        rowId: documentId,
        data: updates
      });
      return data;
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

      const data = await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,
        rowId: documentId,
        data: updates
      });
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Delete attendance record
  async deleteAttendance(documentId) {
    try {
      await this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,
        rowId: documentId
      });
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

  // Get attendance statistics for a student
  async getStudentAttendanceStats(
    userId,
    batchId,
    startDate = null,
    endDate = null,
  ) {
    if (!batchId) return { total: 0, presentDays: 0, absentDays: 0, lateDays: 0, workingDays: 0, percentage: 0 };
    try {
      const baseQueries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
      ];

      if (startDate) {
        baseQueries.push(
          Query.greaterThanEqual("date", this.formatDate(startDate)),
        );
      }
      if (endDate) {
        baseQueries.push(Query.lessThanEqual("date", this.formatDate(endDate)));
      }

      // Fetch counts for each status in parallel
      const lateCount = 0;
      const [presentCount, absentCount] = await Promise.all([
        this.database
          .listRows({
          databaseId: conf.databaseId,
          tableId: conf.newAttendanceCollectionId,

          queries: [
              ...baseQueries,
              Query.equal("status", "present"),
              Query.limit(1),
            ]
        })
          .then((res) => res.total),

        this.database
          .listRows({
          databaseId: conf.databaseId,
          tableId: conf.newAttendanceCollectionId,

          queries: [
              ...baseQueries,
              Query.equal("status", "absent"),
              Query.limit(1),
            ]
        })
          .then((res) => res.total),

        // this.database
        //   .listDocuments(conf.databaseId, conf.newAttendanceCollectionId, [
        //     ...baseQueries,
        //     Query.equal("status", "late"),
        //     Query.limit(1),
        //   ])
        //   .then((res) => res.total),
      ]);

      const total = presentCount + absentCount;
      const workingDays = total;
      const stats = {
        total,
        presentDays: presentCount,
        absentDays: absentCount,
        lateDays: lateCount,
        workingDays,
        percentage:
          workingDays > 0
            ? parseFloat(((presentCount / workingDays) * 100).toFixed(2))
            : 0,
      };

      return stats;
    } catch (error) {
      throw error;
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

      const stats = {
        total: data.total,
        present: 0,
        absent: 0,
        late: 0,
        holiday: 0,
        percentage: 0,
      };

      data.documents.forEach((doc) => {
        if (doc.status === "present") stats.present++;
        else if (doc.status === "absent") stats.absent++;
        else if (doc.status === "late") stats.late++;
        else if (doc.status === "holiday") stats.holiday++;
      });

      if (stats.total > 0) {
        stats.percentage = parseFloat(
          (((stats.present + stats.late) / stats.total) * 100).toFixed(2),
        );
      }

      return stats;
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
  async getStudentAttendanceCount(userId, batchId, status, startDate = null, endDate = null) {
    if (!userId || !batchId || !status) return 0;
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.equal("status", status),
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
        if (doc.status === "present") userAttendance[doc.userId].present++;
        else if (doc.status === "late") userAttendance[doc.userId].late++;
        else if (doc.status === "absent") userAttendance[doc.userId].absent++;
        else if (doc.status === "holiday") userAttendance[doc.userId].holiday++;
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
          (doc) => doc.status === "present",
        ).length;
        const absentCount = documents.filter(
          (doc) => doc.status === "absent",
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
}

export const newAttendanceService = new NewAttendanceService();
