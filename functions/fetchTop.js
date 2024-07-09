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

    const getContributorsAndScorers = async (startDate) => {
      // Fetch all necessary data in one call
      const [questions, mockTests] = await Promise.all([
        database.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_QUES_COLLECTION_ID,
          [Query.greaterThanEqual("$createdAt", startDate)]
        ),
        database.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          process.env.QUESTIONPAPER_COLLECTION_ID,
          [Query.greaterThanEqual("$createdAt", startDate)]
        ),
      ]);

      // Calculate the number of questions created by each user
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

      // Calculate the top scorers
      const userScores = mockTests.documents.reduce((acc, doc) => {
        if (acc[doc.userId]) {
          acc[doc.userId].score =
            Math.max(doc.score, acc[doc.userId].score) || 0;
        } else {
          acc[doc.userId] = {
            userName: doc.userName,
            userId: doc.userId,
            score: doc.score || 0,
          };
        }
        return acc;
      }, {});

      // Convert to arrays and sort
      const sortedContributors = Object.values(userQuestionsCount)
        .sort((a, b) => b.questionsCount - a.questionsCount)
        .slice(0, 5);

      const sortedScorers = Object.values(userScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return { contributors: sortedContributors, scorers: sortedScorers };
    };

    const topContributors = {
      day: await getContributorsAndScorers(startOfDay),
      week: await getContributorsAndScorers(startOfWeek),
      month: await getContributorsAndScorers(startOfMonth),
    };

    log(JSON.stringify({ topContributors }));

    return res.json({ topContributors });
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
