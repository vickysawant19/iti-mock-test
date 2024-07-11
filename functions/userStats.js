import { arMA } from "date-fns/locale";
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

    log(today);
    const questions = await fetchAllDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_QUES_COLLECTION_ID
    );
    log("ques");
    const mockTests = await fetchAllDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.QUESTIONPAPER_COLLECTION_ID
    );
    log("mock");
    const userStats = await fetchAllDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.USER_STATS_COLLECTION_ID
    );

    log("userstats");

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

    log(JSON.stringify(dayStats));

    const existingUserStatsMap = userStats.reduce((acc, doc) => {
      acc[doc.userId] = doc.$id;
      return acc;
    }, {});

    const updateUserStats = async (userId, userData) => {
      const documentId = existingUserStatsMap[userId];

      if (documentId) {
        await database.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.USER_STATS_COLLECTION_ID,
          documentId,
          userData
        );
      } else {
        await database.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.USER_STATS_COLLECTION_ID,
          "unique()", // assuming Appwrite generates unique ID if not provided
          userData
        );
      }
    };

    const consolidateAndUpdateStats = async () => {
      const consolidatedStats = {};

      const periods = ["day", "week", "month", "year", "allTime"];
      const statsArray = [
        dayStats,
        weekStats,
        monthStats,
        yearStats,
        allTimeStats,
      ];

      statsArray.forEach((stats, index) => {
        const period = periods[index];

        Object.keys(stats.questionsStats).forEach((userId) => {
          if (!consolidatedStats[userId]) {
            consolidatedStats[userId] = {
              userId,
              userName: stats.questionsStats[userId].userName,
            };
          }

          consolidatedStats[userId][`${period}_questionsCount`] =
            stats.questionsStats[userId].questionsCount;
          consolidatedStats[userId][`${period}_testsCount`] =
            stats.testsStats[userId]?.userTestsCount || 0;
          consolidatedStats[userId][`${period}_maxScore`] =
            stats.testsStats[userId]?.maxScore || 0;
        });
      });

      const promises = Object.keys(consolidatedStats).map(async (userId) => {
        await updateUserStats(userId, consolidatedStats[userId]);
      });

      await Promise.all(promises);
    };

    await consolidateAndUpdateStats();

    return res.json({
      dayStats,
      weekStats,
      mockTests,
      yearStats,
      allTimeStats,
    });
  } catch (err) {
    error(err.message);
    return res.json({ error: err.message });
  }
};
