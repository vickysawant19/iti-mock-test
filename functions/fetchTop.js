import { Client, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_URL)
    .setProject(process.env.APPWRITE_PROJECT_ID);

  const database = new Databases(client);

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

    const [questions, mockTests] = await Promise.all([
      database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_QUES_COLLECTION_ID,
        [Query.greaterThanEqual("$createdAt", startOfMonth), Query.limit()]
      ),
      database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.QUESTIONPAPER_COLLECTION_ID,
        [Query.greaterThanEqual("$createdAt", startOfMonth)]
      ),
    ]);
    log(questions.total);

    const filterAndFormatData = (data, startDate, formatFn) => {
      return data
        .filter((doc) => new Date(doc.$createdAt) >= new Date(startDate))
        .reduce((acc, doc) => formatFn(acc, doc), {});
    };

    const usersQuestionsCount = (acc, doc) => {
      if (acc[doc.userId]) {
        acc[doc.userId].questionsCount += 1;
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
        questions.documents,
        startDate,
        usersQuestionsCount
      );
      const gropedUsersScores = filterAndFormatData(
        mockTests.documents,
        startDate,
        usersScores
      );

      const sortedUsersQuestions = Object.values(groupedUsersQuestionsCount)
        .sort((a, b) => b.questionsCount - a.questionsCount)
        .slice(0, 5);

      const sortedUsersScorers = Object.values(gropedUsersScores)
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

    // log(JSON.stringify({ topContributors }));

    return res.json({ topContributors });
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
