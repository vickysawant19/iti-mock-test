import { functions } from "./appwriteClient";
import conf from "../config/config";
import { QuestionData } from "./question.service";

class QuestionFunctionService {
  private async execute(action: string, extraBody: any) {
    try {
      const response = await functions.createExecution(
        conf.mockTestFunctionId,
        JSON.stringify({
          action,
          databaseId: conf.databaseId,
          quesCollectionId: conf.quesCollectionId,
          ...extraBody
        })
      );

      if (!response.responseBody) {
        throw new Error("No response received from the Cloud Function.");
      }

      const result = JSON.parse(response.responseBody);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    } catch (err: any) {
      throw new Error(err.message || "Cloud Function execution failed");
    }
  }

  async createQuestion(data: QuestionData) {
    return await this.execute("createQuestion", { payload: data });
  }

  async updateQuestion(id: string, data: Partial<QuestionData>) {
    return await this.execute("updateQuestion", { id, payload: data });
  }

  async deleteQuestion(id: string) {
    return await this.execute("deleteQuestion", { id });
  }

  async bulkAddQuestions(payload: any) {
    return await this.execute("bulkAddQuestions", payload);
  }

  async bulkUpdateQuestions(payload: any) {
    return await this.execute("bulkUpdateQuestions", payload);
  }

  async bulkDeleteQuestions(payload: any) {
    return await this.execute("bulkDeleteQuestions", payload);
  }
}

export const questionFunctionService = new QuestionFunctionService();
export default questionFunctionService;
