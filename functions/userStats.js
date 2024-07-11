import { Client, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_URL)
    .setProject(process.env.APPWRITE_PROJECT_ID);

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
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    ).toISOString();
    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    ).toISOString();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

    const questions = await fetchAllDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_QUES_COLLECTION_ID
    );

    const mockTests = await fetchAllDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.QUESTIONPAPER_COLLECTION_ID
    );

    const filterAndFormatData = (data, startDate, formatFn) => {
      return data
        .filter((doc) => new Date(doc.$createdAt) >= new Date(startDate))
        .reduce((acc, doc) => formatFn(acc, doc), {});
    };

    const usersQuestionsStats = (acc, doc) => {
      if (acc[doc.userId]) {
        acc[doc.userId].questionsCount += 1;
        acc[doc.userId].userName = doc.userName;
      } else {
        acc[doc.userId] = {
          userName: doc.userName,
          userId: doc.userId,
          questionsCount: 1,
        };
      }
      return acc;
    };

    const usersTestsStats = (acc, doc) => {
      if (acc[doc.userId]) {
        acc[doc.userId].userName = doc.userName;
        acc[doc.userId].userTestsCount += 1;
        acc[doc.userId].maxScore = Math.max(
          doc.score,
          acc[doc.userId].maxScore || 0
        );
      } else {
        acc[doc.userId] = {
          userName: doc.userName,
          userId: doc.userId,
          userTestsCount: 1,
          maxScore: doc.score || 0,
        };
      }
      return acc;
    };

    const getStats = (startDate) => {
      const groupedUsersQuestionsStats = filterAndFormatData(
        questions,
        startDate,
        usersQuestionsStats
      );
      const groupedUsersTestsStats = filterAndFormatData(
        mockTests,
        startDate,
        usersTestsStats
      );

      return {
        questionsStats: groupedUsersQuestionsStats,
        testsStats: groupedUsersTestsStats,
      };
    };

    const dayStats = getStats(startOfDay);
    const weekStats = getStats(startOfWeek);
    const monthStats = getStats(startOfMonth);
    const yearStats = getStats(startOfYear);
    const allTimeStats = getStats(new Date(0).toISOString()); // Unix epoch time for all-time stats

    const updateUserStats = async (userId, userData) => {
      const existingDocument = await database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.USER_STATS_COLLECTION_ID,
        [Query.equal("userId", userId)]
      );

      if (existingDocument.total > 0) {
        await database.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.USER_STATS_COLLECTION,
          existingDocument.documents[0].$id,
          userData
        );
      } else {
        await database.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.USER_STATS_COLLECTION,
          "unique()", // assuming Appwrite generates unique ID if not provided
          userData
        );
      }
    };

    const consolidateAndUpdateStats = async (stats, period) => {
      for (const userId in stats.questionsStats) {
        const userData = {
          userId,
          userName: stats.questionsStats[userId].userName,
          [`${period}_questionsCount`]:
            stats.questionsStats[userId].questionsCount,
          [`${period}_testsCount`]:
            stats.testsStats[userId]?.userTestsCount || 0,
          [`${period}_maxScore`]: stats.testsStats[userId]?.maxScore || 0,
        };

        await updateUserStats(userId, userData);
      }
    };

    await consolidateAndUpdateStats(dayStats, "day");
    await consolidateAndUpdateStats(weekStats, "week");
    await consolidateAndUpdateStats(monthStats, "month");
    await consolidateAndUpdateStats(yearStats, "year");
    await consolidateAndUpdateStats(allTimeStats, "allTime");

    return res.json({ message: "User statistics updated successfully." });
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
