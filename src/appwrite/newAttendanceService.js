import { Query, ID } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";
import { format } from "date-fns";

class NewAttendanceService {
  constructor() {
    this.database = appwriteService.getDatabases();
  }

  // Fetch all documents using pagination (handles documents.total automatically)
  async fetchAllDocuments(queries = []) {
    try {
      let allDocuments = [];
      let offset = 0;
      const limit = 100; // Appwrite's max limit per request
      let hasMore = true;

      while (hasMore) {
        const response = await this.database.listDocuments(
          conf.databaseId,
          conf.newAttendanceCollectionId,
          [...queries, Query.limit(limit), Query.offset(offset)]
        );

        allDocuments = allDocuments.concat(response.documents);
        offset += response.documents.length;

        // Check if we've fetched all documents
        hasMore = response.documents.length === limit && offset < response.total;
      }

      return {
        documents: allDocuments,
        total: allDocuments.length
      };
    } catch (error) {
      throw error;
    }
  }

  // Get student attendance by userId and batchId
  async getStudentAttendance(userId, batchId) {
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.orderDesc("date")
      ];

      return (await this.fetchAllDocuments(queries)).documents;
    } catch (error) {
      throw error;
    }
  }

  // Get student attendance for a specific date range
  async getStudentAttendanceByDateRange(userId, batchId, startDate, endDate) {
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.greaterThanEqual("date", this.formatDate(startDate)),
        Query.lessThanEqual("date", this.formatDate(endDate)),
        Query.orderDesc("date")
      ];

      return await this.fetchAllDocuments(queries);
    } catch (error) {
      throw error;
    }
  }

  // Get attendance for a specific date
  async getAttendanceByDate(userId, batchId, date) {
    try {
      const data = await this.database.listDocuments(
        conf.databaseId,
        conf.newAttendanceCollectionId,
        [
          Query.equal("userId", userId),
          Query.equal("batchId", batchId),
          Query.equal("date", this.formatDate(date)),
          Query.limit(1)
        ]
      );
      return data.documents.length > 0 ? data.documents[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get batch attendance for a specific date (all students)
  async getBatchAttendanceByDate(batchId, date) {
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.equal("date", this.formatDate(date))
      ];

      return await this.fetchAllDocuments(queries);
    } catch (error) {
      throw error;
    }
  }

  // Get batch attendance with pagination (for UI with infinite scroll)
  async getBatchAttendance(batchId, limit = 100, offset = 0) {
    try {
      const data = await this.database.listDocuments(
        conf.databaseId,
        conf.newAttendanceCollectionId,
        [
          Query.equal("batchId", batchId),
          Query.orderDesc("date"),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get all batch attendance (fetch all pages)
  async getAllBatchAttendance(batchId) {
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.orderDesc("date")
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
        Query.orderDesc("date")
      ];

      if (startDate) {
        queries.push(Query.greaterThanEqual("date", this.formatDate(startDate)));
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
  async getAttendanceByStatus(batchId, status, startDate = null, endDate = null) {
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.equal("status", status)
      ];

      if (startDate) {
        queries.push(Query.greaterThanEqual("date", this.formatDate(startDate)));
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
  async createAttendance({userId, batchId, tradeId, date, status, remarks = null, markedAt = null, markedBy = null}) {
    try {
      // Ensure date is in YYYY-MM-DD format (10 characters)
      const formattedDate = this.formatDate(date);
      const data = await this.database.createDocument(
        conf.databaseId,
        conf.newAttendanceCollectionId,
        ID.unique(),
        {
          userId,
          batchId,
          tradeId,
          date: formattedDate,
          status,
          remarks: remarks || null,
          markedAt: markedAt || new Date().toISOString(),
          markedBy: markedBy || null
        }
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Create multiple attendance records (client-side loop)
  async createMultipleAttendance(attendanceRecords) {
    try {
      const results = [];
      const errors = [];

      for (const record of attendanceRecords) {
        try {
          const formattedDate = this.formatDate(record.date);
          
          const data = await this.database.createDocument(
            conf.databaseId,
            conf.newAttendanceCollectionId,
            ID.unique(),
            {
              userId: record.userId,
              batchId: record.batchId,
              tradeId: record.tradeId || null,
              date: formattedDate,
              status: record.status,
              remarks: record.remarks || null
            }
          );
          results.push(data);
        } catch (error) {
          // Skip duplicates (409 error)
          if (error.code !== 409) {
            errors.push({
              record,
              error: error.message
            });
          }
        }
      }

      return {
        success: results,
        errors,
        total: attendanceRecords.length,
        created: results.length,
        failed: errors.length
      };
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

      const data = await this.database.updateDocument(
        conf.databaseId,
        conf.newAttendanceCollectionId,
        documentId,
        updates
      );
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

      const data = await this.database.updateDocument(
        conf.databaseId,
        conf.newAttendanceCollectionId,
        documentId,
        updates
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Delete attendance record
  async deleteAttendance(documentId) {
    try {
      await this.database.deleteDocument(
        conf.databaseId,
        conf.newAttendanceCollectionId,
        documentId
      );
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Get attendance statistics for a student
  async getStudentAttendanceStats(userId, batchId, startDate = null, endDate = null) {
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId)
      ];

      if (startDate) {
        queries.push(Query.greaterThanEqual("date", this.formatDate(startDate)));
      }
      if (endDate) {
        queries.push(Query.lessThanEqual("date", this.formatDate(endDate)));
      }

      const data = await this.fetchAllDocuments(queries);

      const stats = {
        total: data.total,
        present: 0,
        absent: 0,
        late: 0,
        holiday: 0,
        percentage: 0,
        workingDays: 0
      };

      data.documents.forEach(doc => {
        if (doc.status === "present") stats.present++;
        else if (doc.status === "absent") stats.absent++;
        else if (doc.status === "late") stats.late++;
        else if (doc.status === "holiday") stats.holiday++;
      });

      stats.workingDays = stats.total - stats.holiday;
      if (stats.workingDays > 0) {
        stats.percentage = parseFloat(
          ((stats.present + stats.late) / stats.workingDays * 100).toFixed(2)
        );
      }

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Get batch attendance statistics for a specific date
  async getBatchAttendanceStats(batchId, date) {
    try {
      const formattedDate = this.formatDate(date);
      
      const queries = [
        Query.equal("batchId", batchId),
        Query.equal("date", formattedDate)
      ];

      const data = await this.fetchAllDocuments(queries);

      const stats = {
        total: data.total,
        present: 0,
        absent: 0,
        late: 0,
        holiday: 0,
        percentage: 0
      };

      data.documents.forEach(doc => {
        if (doc.status === "present") stats.present++;
        else if (doc.status === "absent") stats.absent++;
        else if (doc.status === "late") stats.late++;
        else if (doc.status === "holiday") stats.holiday++;
      });

      if (stats.total > 0) {
        stats.percentage = parseFloat(
          ((stats.present + stats.late) / stats.total * 100).toFixed(2)
        );
      }

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Mark batch attendance for a specific date (loop approach)
  async markBatchAttendance(batchId, date, attendanceData) {
    try {
      const formattedDate = this.formatDate(date);
      const results = [];
      const errors = [];

      for (const record of attendanceData) {
        try {
          const data = await this.database.createDocument(
            conf.databaseId,
            conf.newAttendanceCollectionId,
            ID.unique(),
            {
              userId: record.userId,
              batchId,
              tradeId: record.tradeId || null,
              date: formattedDate,
              status: record.status,
              remarks: record.remarks || null
            }
          );
          results.push(data);
        } catch (error) {
          if (error.code !== 409) {
            errors.push({
              userId: record.userId,
              error: error.message
            });
          }
        }
      }

      return {
        success: results,
        errors,
        total: attendanceData.length,
        created: results.length,
        failed: errors.length
      };
    } catch (error) {
      throw error;
    }
  }

  // Get monthly attendance summary
  async getMonthlyAttendance(userId, batchId, year, month) {
    try {
      // Format dates as YYYY-MM-DD (10 characters)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const queries = [
        Query.equal("userId", userId),
        Query.equal("batchId", batchId),
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
        Query.orderAsc("date")
      ];

      return await this.fetchAllDocuments(queries);
    } catch (error) {
      throw error;
    }
  }

  // Get students with low attendance
  async getLowAttendanceStudents(batchId, startDate, endDate, threshold = 75) {
    try {
      const queries = [Query.equal("batchId", batchId)];

      if (startDate) {
        queries.push(Query.greaterThanEqual("date", this.formatDate(startDate)));
      }
      if (endDate) {
        queries.push(Query.lessThanEqual("date", this.formatDate(endDate)));
      }

      const data = await this.fetchAllDocuments(queries);

      // Group by userId
      const userAttendance = {};
      data.documents.forEach(doc => {
        if (!userAttendance[doc.userId]) {
          userAttendance[doc.userId] = {
            userId: doc.userId,
            total: 0,
            present: 0,
            late: 0,
            absent: 0,
            holiday: 0
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
        .map(student => {
          const workingDays = student.total - student.holiday;
          const percentage = workingDays > 0 
            ? parseFloat(((student.present + student.late) / workingDays * 100).toFixed(2))
            : 0;
          return { ...student, percentage, workingDays };
        })
        .filter(student => student.percentage < threshold)
        .sort((a, b) => a.percentage - b.percentage);

      return lowAttendanceStudents;
    } catch (error) {
      throw error;
    }
  }

  // Check if attendance exists
  async checkAttendanceExists(userId, batchId, date) {
    try {
      const formattedDate = this.formatDate(date);
      
      const data = await this.database.listDocuments(
        conf.databaseId,
        conf.newAttendanceCollectionId,
        [
          Query.equal("userId", userId),
          Query.equal("batchId", batchId),
          Query.equal("date", formattedDate),
          Query.limit(1)
        ]
      );
      return data.documents.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get distinct dates for a batch
  async getBatchAttendanceDates(batchId, limit = 30) {
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.orderDesc("date")
      ];

      const data = await this.fetchAllDocuments(queries);

      // Get unique dates
      const dates = [...new Set(data.documents.map(doc => doc.date))].slice(0, limit);
      return dates;
    } catch (error) {
      throw error;
    }
  }

  // Get attendance count by date range
  async getAttendanceCountByDateRange(batchId, startDate, endDate, status = null) {
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.greaterThanEqual("date", this.formatDate(startDate)),
        Query.lessThanEqual("date", this.formatDate(endDate))
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

  // Utility: Format date to YYYY-MM-DD (10 characters)
  formatDate(date) {
    if (!date) return null;
     console.log(date)
    // If already in correct format
    if (typeof date === 'string' && date.length === 10 && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    console.log("here")

    // If Date object or other format, convert
    const dateObj = date instanceof Date ? date : new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
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
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    return { startDate, endDate, year, month };
  }
}

export const newAttendanceService = new NewAttendanceService();