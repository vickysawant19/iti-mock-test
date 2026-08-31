import conf from "../../config/config";
import { appwriteService } from "../core/appwriteClient";
import { ID, Query } from "appwrite";

class HolidayService {
  constructor() {
    this.database = appwriteService.getTablesDB();
  }

  async getAllHolidays(queries) {
    try {
      let offset = 0;
      const limit = 100;
      const allDocuments = [];
      let response;
      do {
        response = await this.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.holidayDaysCollectionId,
          queries: [...queries, Query.limit(limit), Query.offset(offset)]
        });
        const rows = response.rows || response.documents || [];
        allDocuments.push(...rows);
        offset += rows.length;
      } while (response.rows && response.rows.length > 0);
      return allDocuments;
    } catch (error) {
      throw new Error(`Error fetching all holidays: ${error.message}`);
    }
  }

  async getBatchHolidays(batchId, customQueries = []) {
    if (!batchId) return [];
    try {
      const data = this.getAllHolidays([Query.equal("batchId", batchId), ...customQueries]);
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getHolidayByDate(date, batchId) {
    if (!batchId) return null;
    try {
      const data = await this.getAllHolidays([
        Query.equal("batchId", batchId),
        Query.equal("date", date),
      ]);

      return data?.length > 0 ? data[0] : null;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBatchHolidaysByDateRange(batchId, startDate, endDate) {
    if (!batchId) return [];
    try {
      const data = this.getAllHolidays([
        Query.equal("batchId", batchId),
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
      ]);
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async removeHoliday(holidayId, batchId = null, date = null) {
    try {
      const functions = appwriteService.getFunctions();
      const payload = JSON.stringify({
        action: "removeHoliday",
        holidayId,
        batchId,
        date,
      });

      const response = await functions.createExecution({
        functionId: conf.userManageFunctionId,
        body: payload,
        async: false
      });

      const resData = JSON.parse(response.responseBody || "{}");
      if (Array.isArray(resData.logs) && resData.logs.length > 0) {
        console.group("🔥 [SERVER DEBUG LOGS - removeHoliday]");
        resData.logs.forEach((l) => console.log(l));
        console.groupEnd();
      }
      if (!resData.success) {
        throw new Error(resData.error || "Failed to remove holiday");
      }

      return resData.data;
    } catch (error) {
      console.error("removeHoliday error:", error);
      throw new Error(error.message);
    }
  }

  async addHoliday(holidayData) {
    try {
      const { dayType, ...cleanData } = holidayData || {};
      const functions = appwriteService.getFunctions();
      const payload = JSON.stringify({
        action: "addHoliday",
        batchId: cleanData.batchId,
        date: cleanData.date,
        holidayText: cleanData.holidayText,
      });

      const response = await functions.createExecution({
        functionId: conf.userManageFunctionId,
        body: payload,
        async: false
      });

      const resData = JSON.parse(response.responseBody || "{}");
      if (Array.isArray(resData.logs) && resData.logs.length > 0) {
        console.group("🔥 [SERVER DEBUG LOGS - addHoliday]");
        resData.logs.forEach((l) => console.log(l));
        console.groupEnd();
      }
      if (!resData.success) {
        throw new Error(resData.error || "Failed to add holiday");
      }

      return resData.data;
    } catch (error) {
      console.error("addHoliday error:", error);
      throw new Error(error.message);
    }
  }

  async updateHoliday(holidayId, holidayData) {
    try {
      return await this.addHoliday(holidayData);
    } catch (error) {
      console.error("updateHoliday error:", error);
      throw new Error(error.message);
    }
  }
}

export const holidayService = new HolidayService();
export default holidayService;
