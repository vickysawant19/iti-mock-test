import { Client, Databases, Query } from "node-appwrite";
import { format } from "date-fns";

export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_URL)
    .setProject(process.env.APPWRITE_PROJECT_ID);

  const database = new Databases(client);

  const userId = req.body;

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

    // Fetch all questions and mock tests data
    const [questions, mockTests] = await Promise.all([
      database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_QUES_COLLECTION_ID,
        [
          Query.greaterThanEqual("$createdAt", startOfMonth),
          Query.equal("userId", userId),
          Query.limit(100),
        ]
      ),
      database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.QUESTIONPAPER_COLLECTION_ID,
        [
          Query.greaterThanEqual("$createdAt", startOfMonth),
          Query.equal("userId", userId),
          Query.limit(100),
        ]
      ),
    ]);

    const filterAndFormatData = (data, startDate, formatFn) => {
      const formattedData = data
        .filter((doc) => new Date(doc.$createdAt) >= new Date(startDate))
        .reduce((acc, doc) => formatFn(acc, doc), {});
      return formattedData;
    };

    const formatQuestions = (acc, doc) => {
      const date = format(new Date(doc.$createdAt), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count += 1;
      return acc;
    };

    const formatScores = (acc, doc) => {
      const paperId = doc.paperId;
      if (!acc[paperId]) {
        acc[paperId] = { paperId, score: doc.score || 0 };
      }
      return acc;
    };

    const getUserData = (startDate) => {
      const groupedQuestions = filterAndFormatData(
        questions.documents,
        startDate,
        formatQuestions
      );
      const scoresByPaper = filterAndFormatData(
        mockTests.documents,
        startDate,
        formatScores
      );

      return {
        questionsCreated: Object.values(groupedQuestions),
        scoresByPaper: Object.values(scoresByPaper),
      };
    };

    const userData = {
      day: getUserData(startOfDay),
      week: getUserData(startOfWeek),
      month: getUserData(startOfMonth),
    };

    // log(JSON.stringify({ userData }));

    return res.json({ userData });
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
