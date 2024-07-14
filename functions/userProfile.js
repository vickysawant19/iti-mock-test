import { Client, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_URL)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

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

  try {
    const [userStats, userProfiles] = await Promise.all([
      fetchAllDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.USER_STATS_COLLECTION_ID
      ),
      fetchAllDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.USER_PROFILE_COLLECTION_ID
      ),
    ]);

    const userProfileMap = userProfiles.reduce((acc, profile) => {
      acc[profile.userId] = profile;
      return acc;
    }, {});

    const tradeId = "667e843500333017b716";
    const batchId = "6693a343001c12fb4a85";
    const enrolledAt = new Date().toISOString();

    const updatePromises = userStats.map(async (userStat) => {
      const userId = userStat.userId;
      const updatedData = {
        userId: userId,
        userName: userStat.userName || "",
        year_questionsCount: userStat.year_questionsCount || 0,
        year_testsCount: userStat.year_testsCount || 0,
        tradeId: tradeId,
        batchId: batchId,
        enrolledAt: enrolledAt,
      };

      try {
        if (userProfileMap[userId]) {
          await database.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.USER_PROFILE_COLLECTION_ID,
            userProfileMap[userId].$id,
            updatedData
          );
        } else {
          await database.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.USER_PROFILE_COLLECTION_ID,
            "unique()",
            updatedData
          );
        }
      } catch (err) {
        error(
          `Error updating/creating document for user: ${userId} - ${err.message}`
        );
      }
    });

    await Promise.all(updatePromises);

    return res.json({
      message: "All user profiles are updated",
    });
  } catch (err) {
    error(err.message);
    return res.json({ error: err.message });
  }
};
