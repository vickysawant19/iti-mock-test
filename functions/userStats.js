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

    const startOfYear = new Date(today.getFullYear(), 0, 1) / toISOString();

    const AllTime = new Date().toDateString();

    const questions = await fetchAllDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_QUES_COLLECTION_ID
      // [Query.greaterThanEqual("$createdAt", startOfMonth)]
    );
    const mockTests = await fetchAllDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.QUESTIONPAPER_COLLECTION_ID
      // [Query.greaterThanEqual("$createdAt", startOfMonth)]
    );

    const filterAndFormatData = (data, startDate, formatFn) => {
      return data
        .filter((doc) => new Date(doc.$createdAt) >= new Date(startDate))
        .reduce((acc, doc) => formatFn(acc, doc), {});
    };

    const usersQuestionsCount = (acc, doc) => {
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

    const usersScores = (acc, doc) => {
      if (acc[doc.userId]) {
        acc[doc.userId].userName = doc.userName;
        acc[doc.userId].score = Math.max(doc.score, acc[doc.userId].score) || 0;
      } else {
        acc[doc.userId] = {
          userName: doc.userName,
          userId: doc.userId,
          score: doc.score || 0,
        };
      }
      return acc;
    };

    const getContributionData = (startDate) => {
      const groupedUsersQuestionsCount = filterAndFormatData(
        questions,
        startDate,
        usersQuestionsCount
      );
      const groupedUsersScores = filterAndFormatData(
        mockTests,
        startDate,
        usersScores
      );

      const sortedUsersQuestions = Object.values(groupedUsersQuestionsCount)
        .sort((a, b) => b.questionsCount - a.questionsCount)
        .slice(0, 5);

      const sortedUsersScorers = Object.values(groupedUsersScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return {
        contributors: sortedUsersQuestions,
        scorers: sortedUsersScorers,
      };
    };

    const topContributors = {
      day: getContributionData(startOfDay),
      week: getContributionData(startOfWeek),
      month: getContributionData(startOfMonth),
    };

    const updateUserStats = async (userId, userData) => {
      const existingDocument = await database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.USER_STATS_COLLECTION_ID,
        [Query.equal("userId", userId)]
      );

      if (existingDocument.total > 0) {
        await database.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.USER_STATS_COLLECTION_ID,
          existingDocument.documents[0].$id,
          { data: JSON.stringify(userData) }
        );
      } else {
        await database.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.USER_STATS_COLLECTION_ID,
          "unique()", // assuming Appwrite generates unique ID if not provided
          { userId, data: JSON.stringify(userData) }
        );
      }
    };

    const promises = [];

    Object.keys(topContributors.day.contributors).forEach((userId) => {
      const userData = {
        ...topContributors.day.contributors[userId],
        score: topContributors.day.scorers[userId]?.score || 0,
      };
      promises.push(updateUserStats(userId, userData));
    });

    Object.keys(topContributors.week.contributors).forEach((userId) => {
      const userData = {
        ...topContributors.week.contributors[userId],
        score: topContributors.week.scorers[userId]?.score || 0,
      };
      promises.push(updateUserStats(userId, userData));
    });

    Object.keys(topContributors.month.contributors).forEach((userId) => {
      const userData = {
        ...topContributors.month.contributors[userId],
        score: topContributors.month.scorers[userId]?.score || 0,
      };
      promises.push(updateUserStats(userId, userData));
    });

    await Promise.all(promises);

    return res.json({ topContributors });
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
