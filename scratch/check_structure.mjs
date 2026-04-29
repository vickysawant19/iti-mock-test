
import { appwriteClientService as appwriteService } from "../src/services/appwriteClient.js";
import conf from "../src/config/config.js";
import { Query } from "appwrite";

async function checkQuestionStructure() {
    try {
        const database = appwriteService.getTablesDB();
        const response = await database.listRows({
            databaseId: conf.databaseId,
            tableId: conf.quesCollectionId,
            queries: [Query.limit(1)]
        });
        console.log("Question Structure:", JSON.stringify(response.rows[0], null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

checkQuestionStructure();
