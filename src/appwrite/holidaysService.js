import conf from "@/config/config";
import { appwriteService } from "@/services/appwriteClient";
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
        allDocuments.push(...response.rows);
        offset += response.rows.length;
      } while (response.rows.length > 0);
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

  async removeHoliday(holidayId) {
    try {
      await this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: conf.holidayDaysCollectionId,
        rowId: holidayId
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async addHoliday(holidayData) {
    try {
      const data = await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.holidayDaysCollectionId,
        rowId: ID.unique(),
        data: holidayData
      });
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateHoliday(holidayId, holidayData) {
    try {
      const data = await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.holidayDaysCollectionId,
        rowId: holidayId,
        data: holidayData
      });
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

const holidayService = new HolidayService();

export default holidayService;
