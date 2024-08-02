import { Client, Databases, Query } from "appwrite";
import conf from "./config/config";

const updateData = async () => {
  const client = new Client();
  client.setEndpoint(conf.appwriteUrl).setProject(conf.projectId);

  const database = new Databases(client);

  const fetchAllDocuments = async (databaseId, collectionId) => {
    let documents = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await database.listDocuments(databaseId, collectionId, [
        Query.limit(100),
        Query.offset(offset),
      ]);

      documents = documents.concat(response.documents);
      offset += response.documents.length;
      hasMore = offset < response.total; // Check if more documents are available
    }

    return documents;
  };

  const retryWithBackoff = async (fn, retries = 5, delay = 1000) => {
    try {
      return await fn();
    } catch (err) {
      if (
        retries <= 0 ||
        !err.message.includes(
          "Rate limit for the current endpoint has been exceeded"
        )
      ) {
        throw err;
      }
      console.log(
        `Rate limit exceeded. Retrying after ${delay}ms... (${retries} retries left)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
  };

  try {
    const questions = await fetchAllDocuments(
      conf.databaseId,
      conf.quesCollectionId
    );

    const subjectId = "66ac6056002f66b412e3";

    const updatePromises = questions.map((ques) => {
      const updatedData = { subjectId };

      return retryWithBackoff(async () => {
        await database.updateDocument(
          conf.databaseId,
          conf.quesCollectionId,
          ques.$id,
          updatedData
        );
        console.log(`${ques.$id} updating...`);
      }).catch((err) => {
        console.log(
          `Error updating/creating document for question ID: ${ques.$id} - ${err.message}`
        );
      });
    });

    await Promise.all(updatePromises);

    console.log("All questions' subjectId are updated");
  } catch (err) {
    console.log(`Error updating questions: ${err.message}`);
  }
};

export default updateData;
