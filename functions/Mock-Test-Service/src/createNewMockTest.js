import { Query } from "node-appwrite";

const createNewMockTest = async ({
  paperId,
  userId,
  userName = null,
  error,
  database,
}) => {
  try {
    const paperResponse = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.QUESTIONPAPER_COLLECTION_ID,
      [Query.equal("paperId", paperId),Query.or([Query.equal("isOriginal", true), Query.equal("userId", userId)]) ]
    );


    // Check if the paper exists
    if (paperResponse.total === 0) {
      throw new Error(
        "No paper available for the selected ID. Please check the paperId."
      );
    }

    // Check for duplicate papers within the fetched papers
    const duplicate = paperResponse.documents.find(
      (doc) => doc.userId === userId
    );

    if (duplicate) {
      return { paperId: duplicate.$id, message: "Paper already Attempted." };
    }

    const paper = paperResponse.documents.find(item => item.isOriginal);

    const { tradeId, tradeName, year, questions, quesCount,totalMinutes } = paper;

    const processedQuestions = questions.map((question) => {
      const parsedQuestion = JSON.parse(question);
      parsedQuestion.response = null;
      return JSON.stringify(parsedQuestion);
    });

    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const shuffledQuestions = shuffleArray(processedQuestions);

    // Prepare the new paper data
    const newPaperData = {
      tradeId,
      tradeName,
      year,
      quesCount,
      paperId,
      questions: shuffledQuestions,
      userId,
      userName,
      score: null,
      submitted: false,
      totalMinutes
    };

    // Create a new document in the new collection
    const response = await database.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.QUESTIONPAPER_COLLECTION_ID,
      "unique()",
      newPaperData
    );

    return { paperId: response.$id };
  } catch (err) {
    error(err.message);
    return { error: err.message };
  }
};

export default createNewMockTest;
