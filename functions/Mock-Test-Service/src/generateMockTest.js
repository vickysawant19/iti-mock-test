import { Query } from "node-appwrite";

const generateMockTest = async ({
  userId,
  userName,
  tradeName,
  tradeId,
  subjectId,
  year,
  quesCount,
  error,
  database,
  selectedModules,
  totalMinutes
}) => {
  const fetchQuestions = async (tradeId, year) => {
    let documents = [];
    let offset = 0;
    let hasMore = true;
    const queries = [
      Query.equal("tradeId", tradeId),
      Query.equal("subjectId", subjectId),
      Query.equal("year", year),
      Query.limit(100),
      Query.select(["$id"])
    ];
    
    if (selectedModules.length > 0) {
      queries.push(Query.equal("moduleId", selectedModules));
    }

    while (hasMore) {
      const response = await database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_QUES_COLLECTION_ID,
        [...queries, Query.offset(offset) ]
      );

      documents = documents.concat(response.documents);
      offset += response.documents.length;
      hasMore = offset < response.total;
    }

    return documents;
  };

  const getRandomQuestions = (questions, count) => {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, parseInt(count));
  };

  const getISTDate = () => {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000; // Convert offset to milliseconds
    const istOffset = 5.5 * 3600000; // IST is UTC+5:30
    return new Date(now.getTime() + utcOffset + istOffset);
  };

  const generateRandomSuffix = (length) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const generateUniquePaperId = (tradeName) => {
    const tradePrefix = tradeName.slice(0, 3).toUpperCase();
    const date = getISTDate();
    const formattedDate = date.toISOString().split("T")[0].replace(/-/g, "");
    const formattedTime = date
      .toTimeString()
      .split(" ")[0]
      .replace(/:/g, "")
      .slice(0, 4);
    const randomSuffix = generateRandomSuffix(2);

    return `${tradePrefix}${formattedDate}${formattedTime}${randomSuffix}`;
  };

  try {
    const questions = await fetchQuestions(tradeId, year);
    if (questions.length === 0) {
      throw new Error(
        "No Questions available for the specified trade and year."
      );
    }

    const randomQuestionIds = getRandomQuestions(questions, quesCount);

    const selectedQuestions = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_QUES_COLLECTION_ID,
      [Query.limit(quesCount),
       Query.equal("$id", randomQuestionIds.map(item => item.$id)), 
       Query.select(["$id","question","options" ,"userId","userName","correctAnswer","tradeId", "year","moduleId","images"])]
    );

    const shuffledQuestions = selectedQuestions.documents.sort(() => Math.random - 1)

    const questionsWithResponses = shuffledQuestions.map((question) => ({
      $id: question.$id,
      question: question.question,
      images: question.images,
      options: question.options,
      userId: question.userId,
      userName: question.userName,
      correctAnswer: question.correctAnswer,
      tradeId: question.tradeId,
      year: question.year,
      moduleId: question?.moduleId || "",
      response: null, // initializing response to null
    }));

    const serializedQuestions = questionsWithResponses.map((question) =>
      JSON.stringify(question)
    );

    const paperId = generateUniquePaperId(tradeName);

    const questionPaper = {
      userId,
      userName,
      tradeId,
      tradeName,
      year,
      paperId,
      questions: serializedQuestions,
      quesCount: parseInt(serializedQuestions.length),
      score: null,
      submitted: false,
      isOriginal: true,
      isProtected: true,
      totalMinutes: parseInt(totalMinutes) || 60,
    };

    const response = await database.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.QUESTIONPAPER_COLLECTION_ID,
      "unique()",
      questionPaper
    );

    return { paperId: response.$id };
  } catch (err) {
    error(err);
    return { error: err.message };
  }
};

export default generateMockTest;
