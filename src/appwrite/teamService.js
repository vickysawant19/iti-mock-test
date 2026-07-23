import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";

export class TeamService {
  constructor() {
    this.functions = appwriteService.getFunctions();
  }

  async executeFunction(action, payload = {}) {
    const bodyJson = {
      action,
      ...payload,
    };

    try {
      const execution = await this.functions.createExecution({
        functionId: conf.userManageFunctionId || "678e7277002e1d5c9b9b",
        body: JSON.stringify(bodyJson),
      });

      const response = JSON.parse(execution.responseBody || "{}");
      if (response.success === false) {
        throw new Error(response.error || "Function execution returned error status");
      }
      return response.data;
    } catch (err) {
      console.error(`Appwrite function error [${action}]:`, err);
      throw err;
    }
  }

  async createBatch(batchData) {
    return await this.executeFunction("createBatch", batchData);
  }

  async updateBatch(batchId, batchData) {
    return await this.executeFunction("updateBatch", { batchId, batchData });
  }

  async deleteBatch(batchId, teamId) {
    return await this.executeFunction("deleteBatch", { batchId, teamId });
  }

  async approveStudent(batchId, studentId, details = {}) {
    return await this.executeFunction("approveStudent", { batchId, studentId, details });
  }

  async removeStudent(batchId, studentId) {
    return await this.executeFunction("removeStudent", { batchId, studentId });
  }

  async repairMemberCount(batchId) {
    return await this.executeFunction("repairMemberCount", { batchId });
  }

  async migrateBatches() {
    return await this.executeFunction("migrateBatches");
  }
}

const teamService = new TeamService();
export default teamService;
