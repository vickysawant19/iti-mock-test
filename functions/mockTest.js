import { Client, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_URL)
    .setProject(process.env.APPWRITE_PROJECT_ID);

  const database = new Databases(client);
  const body = req.body;
  const { userId, userName, tradeName, tradeId, year } = JSON.parse(body);
  log(userName);
  log(userId);
  const fetchQuestions = async (tradeId, year) => {
    let documents = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_QUES_COLLECTION_ID,
        [
          Query.equal("tradeId", tradeId),
          Query.equal("year", year),
          Query.limit(100),
          Query.offset(offset),
        ]
      );

      documents = documents.concat(response.documents);
      offset += response.documents.length;
      hasMore = offset < response.total;
    }

    return documents;
  };

  const getRandomQuestions = (questions, count) => {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const getISTDate = () => {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000; // Convert offset to milliseconds
    const istOffset = 5.5 * 3600000; // IST is UTC+5:30
    return new Date(now.getTime() + utcOffset + istOffset);
  };

  try {
    const questions = await fetchQuestions(tradeId, year);

    if (questions.length <= 0) {
      throw new Error("No Questions available");
    }

    const selectedQuestions = getRandomQuestions(questions, 50);

    const questionsWithResponses = selectedQuestions.map((question) => ({
      $id: question.$id,
      question: question.question,
      options: question.options,
      userId: question.userId,
      userName: question.userName,
      correctAnswer: question.correctAnswer,
      tradeId: question.tradeId,
      year: question.year,
      response: null, // initializing response to null
    }));

    const serializedQuestions = questionsWithResponses.map((question) =>
      JSON.stringify(question)
    );

    const tradePrefix = tradeName.slice(0, 3).toUpperCase();
    const date = getISTDate();
    const formattedDate = date.toISOString().split("T")[0].replace(/-/g, "");
    const formattedTime = date.toTimeString().split(" ")[0].replace(/:/g, "");
    const paperId = `${tradePrefix}${formattedDate}${formattedTime}`;

    const questionPaper = {
      userId,
      userName,
      tradeId,
      tradeName,
      year,
      paperId,
      questions: serializedQuestions,
      score: null,
      submitted: false,
    };

    const response = await database.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.QUESTIONPAPER_COLLECTION_ID,
      "unique()",
      questionPaper
    );

    return res.send({ paperId: response.$id });
  } catch (err) {
    error(err);
    return res.send({ error: err.message });
  }
};
