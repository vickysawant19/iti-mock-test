import { Databases, Query, Client } from "node-appwrite";

const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_URL)
  .setProject(process.env.APPWRITE_PROJECT_ID);

const database = new Databases(client);

const createNewMockTest = async ({
  paperId,
  userId,
  userName = null,
  error,
}) => {
  try {
    const paperResponse = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.QUESTIONPAPER_COLLECTION_ID,
      [Query.equal("paperId", paperId)]
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
      throw new Error("You have already attempted this test.");
    }

    const paper = paperResponse.documents[0];

    const { tradeId, tradeName, year, questions } = paper;

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

    // Generate a new paperId with a different suffix
    const newPaperId = paperId.slice(0, -2) + generateRandomSuffix(2);

    // Prepare the new paper data
    const newPaperData = {
      tradeId,
      tradeName,
      year,
      paperId: newPaperId,
      questions: shuffledQuestions,
      userId,
      userName,
      score: null,
      submitted: false,
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
