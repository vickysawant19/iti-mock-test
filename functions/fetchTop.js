import { Client, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_URL)
    .setProject(process.env.APPWRITE_PROJECT_ID);
  // .setKey(process.env.APPWRITE_API_KEY); // Ensure to set API key if necessary

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

    const getContributors = async (startDate) => {
      const questions = await database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_QUES_COLLECTION_ID,
        [Query.greaterThanEqual("$createdAt", startDate)]
      );

      const userQuestionsCount = questions.documents.reduce((acc, doc) => {
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
      }, {});

      const sortedUsers = Object.values(userQuestionsCount)
        .sort((a, b) => b.questionsCount - a.questionsCount)
        .slice(0, 5);

      return sortedUsers;
    };

    const getTopScorers = async (startDate) => {
      const testResults = await database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.QUESTIONPAPER_COLLECTION_ID,
        [Query.greaterThanEqual("$createdAt", startDate)]
      );

      const userScores = testResults.documents.reduce((acc, doc) => {
        if (acc[doc.userId]) {
          acc[doc.userId].score += doc.score;
        } else {
          acc[doc.userId] = {
            userName: doc.userName,
            userId: doc.userId,
            score: doc.score,
          };
        }
        return acc;
      }, {});

      const sortedUsers = Object.values(userScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return sortedUsers;
    };

    const topContributors = {
      day: await getContributors(startOfDay),
      week: await getContributors(startOfWeek),
      month: await getContributors(startOfMonth),
    };

    const topScorers = {
      day: await getTopScorers(startOfDay),
      week: await getTopScorers(startOfWeek),
      month: await getTopScorers(startOfMonth),
    };

    log(JSON.stringify({ topContributors, topScorers }));

    return res.json({ topContributors, topScorers });
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
