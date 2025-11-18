import conf from "@/config/config";
import { appwriteService } from "@/appwrite/appwriteConfig";
import { ID, Query } from "appwrite";

class HolidayService {
  constructor() {
    this.database = appwriteService.getDatabases();
  }

  async getAllHolidays(queries) {
    try {
      let offset = 0;
      const limit = 100;
      const allDocuments = [];
      let response;
      do {
        response = await this.database.listDocuments(
          conf.databaseId,
          conf.holidayDaysCollectionId,
          [...queries, Query.limit(limit), Query.offset(offset)]
        );
        allDocuments.push(...response.documents);
        offset += response.documents.length;
      } while (response.documents.length > 0);
      return allDocuments;
    } catch (error) {
      throw new Error(`Error fetching all holidays: ${error.message}`);
    }
  }

  async getBatchHolidays(batchId) {
    try {
      const data = this.getAllHolidays([Query.equal("batchId", batchId)]);
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBatchHolidaysByDateRange(batchId, startDate, endDate) {
    try {
       console.log("api called time", new Date().getTime())
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
      await this.database.deleteDocument(
        conf.databaseId,
        conf.holidayDaysCollectionId,
        holidayId
      );
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async addHoliday(holidayData) {
    try {
      const data = await this.database.createDocument(
        conf.databaseId,
        conf.holidayDaysCollectionId,
        ID.unique(),
        holidayData
      );
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateHoliday(holidayId, holidayData) {
    try {
      const data = await this.database.updateDocument(
        conf.databaseId,
        conf.holidayDaysCollectionId,
        holidayId,
        holidayData
      );
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

const holidayService = new HolidayService();

export default holidayService;
