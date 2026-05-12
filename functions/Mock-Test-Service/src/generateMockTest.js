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
  totalMinutes,
  tags,
  databaseId: passedDatabaseId,
  quesCollectionId: passedQuesCollectionId,
  questionPapersCollectionId: passedQuestionPapersCollectionId,
  newModulesDataCollectionId: passedNewModulesDataCollectionId
}) => {
  const databaseId = passedDatabaseId || process.env.APPWRITE_DATABASE_ID;
  const quesCollectionId = passedQuesCollectionId || process.env.APPWRITE_QUES_COLLECTION_ID;
  const questionPapersCollectionId = passedQuestionPapersCollectionId || process.env.QUESTIONPAPER_COLLECTION_ID;
  const newModulesDataCollectionId = passedNewModulesDataCollectionId || "newmodulesdata";

  const fetchQuestions = async (tradeId, year) => {
    let documents = [];

    const queries = [
      Query.equal("tradeId", tradeId),
      Query.equal("subjectId", subjectId),
      Query.equal("year", year)
    ];

    // If specific modules are selected, we need to filter by their logical moduleId strings
    if (selectedModules && selectedModules.length > 0) {
      const moduleDocs = await database.listDocuments(
        databaseId,
        newModulesDataCollectionId,
        [
          Query.equal("$id", selectedModules),
          Query.select(["moduleId"])
        ]
      );
      const logicalModuleIds = moduleDocs.documents.map(d => d.moduleId);
      if (logicalModuleIds.length > 0) {
        queries.push(Query.equal("moduleId", logicalModuleIds));
      }
    }

    if (Array.isArray(tags) && tags.length > 0) {
      queries.push(Query.contains("tags", tags));
    }

    let offset = 0;
    let hasMore = true;
    const batchLimit = 100;

    while (hasMore) {
      const response = await database.listDocuments(
        databaseId,
        quesCollectionId,
        [...queries, Query.limit(batchLimit), Query.offset(offset), Query.select(["$id"])]
      );

      documents = documents.concat(response.documents);
      offset += response.documents.length;
      hasMore = offset < response.total && response.documents.length > 0;
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
      databaseId,
      quesCollectionId,
      [Query.limit(quesCount),
       Query.equal("$id", randomQuestionIds.map(item => item.$id)), 
       Query.select(["$id","question","options" ,"userId","userName","correctAnswer","moduleId"])]
    );

    const shuffledQuestions = selectedQuestions.documents.sort(() => Math.random - 1)

    const questionsWithResponses = shuffledQuestions.map((question) => ({
      $id: question.$id,
      question: question.question,
      options: question.options,
      userId: question.userId,
      userName: question.userName,
      correctAnswer: question.correctAnswer,
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
      databaseId,
      questionPapersCollectionId,
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
