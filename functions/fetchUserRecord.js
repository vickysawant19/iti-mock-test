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
        [Query.greaterThanEqual("$createdAt", startOfMonth)]
      ),
      database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.QUESTIONPAPER_COLLECTION_ID,
        [Query.greaterThanEqual("$createdAt", startOfMonth)]
      ),
    ]);

    log("Questions fetched: ", JSON.stringify(questions));
    log("Mock tests fetched: ", JSON.stringify(mockTests));

    const filterAndFormatData = (data, startDate, formatFn) => {
      const filteredData = data.filter((doc) => {
        const isUserMatch = doc.userId === userId;
        const isDateMatch = new Date(doc.$createdAt) >= new Date(startDate);
        log(
          `Filtering ${doc.$id}: userId match=${isUserMatch}, date match=${isDateMatch}`
        );
        return isUserMatch && isDateMatch;
      });

      log("Filtered Data: ", JSON.stringify(filteredData));

      const formattedData = filteredData.reduce((acc, doc) => {
        log(`Formatting ${doc.$id}`);
        return formatFn(acc, doc);
      }, {});

      log("Formatted Data: ", JSON.stringify(formattedData));
      return formattedData;
    };

    const formatQuestions = (acc, doc) => {
      const date = format(new Date(doc.$createdAt), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count += 1;
      log(`Formatted question for date ${date}: count=${acc[date].count}`);
      return acc;
    };

    const formatScores = (acc, doc) => {
      const scoreEntry = {
        paperId: doc.$id,
        score: doc.score || 0,
      };
      acc.push(scoreEntry);
      log(`Formatted score for paper ${doc.$id}: score=${scoreEntry.score}`);
      return acc;
    };

    const getUserData = (startDate) => {
      log(`Getting user data from ${startDate}`);
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

      log("Grouped Questions: ", JSON.stringify(groupedQuestions));
      log("Scores By Paper: ", JSON.stringify(scoresByPaper));

      return {
        questionsCreated: Object.values(groupedQuestions),
        scoresByPaper,
      };
    };

    const userData = {
      day: getUserData(startOfDay),
      week: getUserData(startOfWeek),
      month: getUserData(startOfMonth),
    };

    log("User Data: ", JSON.stringify({ userData }));

    return res.json({ userData });
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
