import { Client, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  log("Updating userStats....");
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
    const getISTDate = () => {
      const now = new Date();
      const utcOffset = now.getTimezoneOffset() * 60000; // Convert offset to milliseconds
      const istOffset = 5.5 * 3600000; // IST is UTC+5:30
      return new Date(now.getTime() + utcOffset + istOffset);
    };

    log(new Date());
    const today = getISTDate();
    log(today);
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

    const [questions, mockTests, userProfile, userStats] = await Promise.all([
      fetchAllDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_QUES_COLLECTION_ID
      ),
      fetchAllDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.QUESTIONPAPER_COLLECTION_ID
      ),
      fetchAllDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.USER_PROFILE_COLLECTION_ID
      ),
      fetchAllDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.USER_STATS_COLLECTION_ID
      ),
    ]);

    const filterAndFormatData = (data, startDate, formatFn) => {
      return data
        .filter((doc) => new Date(doc.$createdAt) >= new Date(startDate))
        .reduce((acc, doc) => formatFn(acc, doc), {});
    };

    const usersQuestionsStats = (acc, doc) => {
      if (acc[doc.userId]) {
        acc[doc.userId].questionsCount += 1;
        acc[doc.userId].questions.push(
          JSON.stringify({
            questionId: doc.$id,
            createdAt: doc.$createdAt,
          })
        );
        acc[doc.userId].userName = doc.userName;
      } else {
        acc[doc.userId] = {
          userName: doc.userName,
          userId: doc.userId,
          questionsCount: 1,
          questions: [
            JSON.stringify({
              questionId: doc.$id,
              createdAt: doc.$createdAt,
            }),
          ],
        };
      }
      return acc;
    };

    const usersTestsStats = (acc, doc) => {
      const quesCount = doc.quesCount ?? 50; // Treat null as 50

      if (acc[doc.userId]) {
        acc[doc.userId].userName = doc.userName;
        acc[doc.userId].userTestsCount += 1;

        if (quesCount === 50) {
          acc[doc.userId].maxScore = Math.max(
            doc.score,
            acc[doc.userId].maxScore || 0
          );
        }
        acc[doc.userId].totalScore += doc.score;
        acc[doc.userId].avgScore =
          acc[doc.userId].totalScore / acc[doc.userId].userTestsCount;

        acc[doc.userId].tests.push(
          JSON.stringify({
            paperId: doc.paperId,
            score: doc.score,
            quesCount: doc.quesCount || 50,
            createdAt: doc.$createdAt,
          })
        );
      } else {
        acc[doc.userId] = {
          userName: doc.userName,
          userId: doc.userId,
          userTestsCount: 1,
          maxScore: doc.quesCount === 50 ? doc.score : 0,
          totalScore: doc.score, //totalScore
          avgScore: doc.score, //avgScore
          tests: [
            JSON.stringify({
              paperId: doc.paperId,
              score: doc.score,
              quesCount: doc.quesCount || 50,
              createdAt: doc.$createdAt,
            }),
          ],
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

    const existingUserStatsMap = userStats.reduce((acc, doc) => {
      acc[doc.userId] = doc.$id;
      return acc;
    }, {});

    const userProfileData = userProfile.reduce((acc, doc) => {
      acc[doc.userId] = {
        tradeId: doc.tradeId,
        batchId: doc.batchId,
        collegeId: doc.collegeId,
        userId: doc.userId,
        userName: doc.userName,
      };
      return acc;
    }, {});

    const updateUserStats = async (userId, userData) => {
      const documentId = existingUserStatsMap[userId];

      const updatedData = {
        allTime_maxScore: userData.allTime_maxScore ?? 0,
        allTime_questionsCount: userData.allTime_questionsCount ?? 0,
        allTime_testsCount: userData.allTime_testsCount ?? 0,

        day_maxScore: userData.day_maxScore ?? 0,
        day_questionsCount: userData.day_questionsCount ?? 0,
        day_testsCount: userData.day_testsCount ?? 0,

        month_maxScore: userData.month_maxScore ?? 0,
        month_questionsCount: userData.month_questionsCount ?? 0,
        month_testsCount: userData.month_testsCount ?? 0,

        week_maxScore: userData.week_maxScore ?? 0,
        week_questionsCount: userData.week_questionsCount ?? 0,
        week_testsCount: userData.week_testsCount ?? 0,

        year_maxScore: userData.year_maxScore ?? 0,
        year_questionsCount: userData.year_questionsCount ?? 0,
        year_testsCount: userData.year_testsCount ?? 0,

        questions: userData.questions,
        tests: userData.tests,
        userId: userProfileData[userId].userId,
        userName: userProfileData[userId].userName,
        tradeId: userProfileData[userId].tradeId,
        batchId: userProfileData[userId].batchId,
        collegeId: userProfileData[userId].collegeId,
      };

      try {
        if (documentId) {
          await database.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.USER_STATS_COLLECTION_ID,
            documentId,
            updatedData
          );
        } else {
          await database.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.USER_STATS_COLLECTION_ID,
            "unique()", // assuming Appwrite generates unique ID if not provided
            updatedData
          );
        }
      } catch (err) {
        error(
          `Error updating/creating document for user: ${userId} - ${err.message}`
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
            stats.questionsStats[userId].questionsCount || 0;
          consolidatedStats[userId].questions =
            stats.questionsStats[userId].questions || [];
        });

        Object.keys(stats.testsStats).forEach((userId) => {
          if (!consolidatedStats[userId]) {
            consolidatedStats[userId] = {
              userId,
              userName: stats.testsStats[userId].userName,
            };
          }

          consolidatedStats[userId][`${period}_testsCount`] =
            stats.testsStats[userId]?.userTestsCount || 0;
          consolidatedStats[userId][`${period}_maxScore`] =
            stats.testsStats[userId]?.maxScore || 0;
          consolidatedStats[userId].tests =
            stats.testsStats[userId].tests || [];
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
      monthStats,
      yearStats,
      allTimeStats,
    });
  } catch (err) {
    error(err.message);
    return res.json({ error: err.message });
  }
};
