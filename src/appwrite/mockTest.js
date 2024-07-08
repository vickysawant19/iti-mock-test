import { Query } from "appwrite";
import quesdbservice from "./database";
import { appwriteService } from "./appwriteConfig";
import conf from "../config/config";
import { format } from "date-fns";

class QuestionPaperService {
  constructor() {
    this.database = appwriteService.getDatabases();
    this.databaseId = conf.databaseId;
    this.questionsCollectionId = conf.quesCollectionId;
    this.questionPapersCollectionId = conf.questionPapersCollectionId;
  }

  async generateQuestionPaper({ userId, userName, tradeName, tradeId, year }) {
    try {
      // Fetching questions
      const questions = await quesdbservice.listQuestions([
        Query.equal("tradeId", tradeId),
        Query.equal("year", year),
      ]);

      if (questions.total <= 0) {
        throw new Error("No Questions available");
      }

      // Selecting random 50 questions
      const selectedQuestions = this.getRandomQuestions(
        questions.documents,
        50
      );

      // Adding response property to each question
      const questionsWithResponses = selectedQuestions.map((question) => ({
        $id: question.$id,
        question: question.question,
        options: question.options,
        userId: question.userId,
        correctAnswer: question.correctAnswer,
        tradeId: question.tradeId,
        year: question.year,
        response: null, // initializing response to null
      }));

      // Serializing questions
      const serializedQuestions = questionsWithResponses.map((question) =>
        JSON.stringify(question)
      );

      // Generating paperId
      const tradePrefix = tradeName.slice(0, 3).toUpperCase();
      const date = new Date();
      const formattedDate = format(date, "yyyyMMdd");
      const formattedTime = format(date, "HHmmssSSS");
      const paperId = `${tradePrefix}${formattedDate}${formattedTime}`;

      // Creating question paper object
      const questionPaper = {
        userId, // id of user who made paper
        userName, // his name
        tradeId, // trade id of paper
        tradeName,
        year,
        paperId,
        questions: serializedQuestions,
        score: null,
        submitted: false,
      };

      // Saving question paper to database
      const response = await this.database.createDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        "unique()",
        questionPaper
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async fetchPaperById(paperId) {
    try {
      const response = await this.database.listDocuments(
        this.databaseId,
        this.questionPapersCollectionId,
        [Query.equal("paperId", paperId)]
      );

      if (response.documents.length > 0) {
        return response.documents[0];
      } else {
        throw new Error("Paper not found");
      }
    } catch (error) {
      console.error("Error fetching paper by ID:", error);
      throw error;
    }
  }

  async createNewPaperDocument(paperId, userId) {
    try {
      const paper = await this.fetchPaperById(paperId);
      if (!paper) {
        throw new Error("No paper available for selected ID");
      }

      const { tradeId, tradeName, year, questions } = paper;

      const processedQuestions = questions.map((question) => {
        const parsedQuestion = JSON.parse(question);
        parsedQuestion.response = null;
        return JSON.stringify(parsedQuestion);
      });

      // Prepare the new paper data
      const newPaperData = {
        tradeId,
        tradeName,
        year,
        paperId,
        questions: processedQuestions,
        userId,
        score: null,
        submitted: false,
      };

      // Create a new document in the new collection
      const response = await this.database.createDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        "unique()",
        newPaperData
      );

      return response;
    } catch (error) {
      console.error("Error creating new paper document:", error);
      throw error;
    }
  }

  getRandomQuestions(questions, count) {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async getQuestionPaper(paperId) {
    try {
      const response = await this.database.getDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        paperId
      );
      return response;
    } catch (error) {
      console.error("Error getting question paper:", error);
    }
  }

  async updateResponse(paperId, questionId, selectedAnswer) {
    try {
      const paper = await this.getQuestionPaper(paperId);
      if (paper.submitted) {
        throw new Error("Cannot update responses for a submitted paper");
      }

      const updatedQuestions = paper.questions.map((question) => {
        const parsedQuestion = JSON.parse(question);
        if (parsedQuestion.$id === questionId) {
          parsedQuestion.response = selectedAnswer;
        }
        return JSON.stringify(parsedQuestion);
      });

      const response = await quesdbservice.updateDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        paperId,
        { questions: updatedQuestions }
      );

      return response;
    } catch (error) {
      console.error("Error updating response:", error);
      throw error;
    }
  }

  async updateAllResponses(paperId, responses) {
    try {
      const paper = await this.getQuestionPaper(paperId);
      if (paper.submitted) {
        throw new Error("Cannot update responses for a submitted paper");
      }

      let score = 0;

      const updatedQuestions = paper.questions.map((question) => {
        const parsedQuestion = JSON.parse(question);
        const response = responses.find(
          (res) => res.questionId === parsedQuestion.$id
        );
        if (response) {
          parsedQuestion.response = response.selectedAnswer;
          const isCorrect =
            parsedQuestion.response === parsedQuestion.correctAnswer;
          if (isCorrect) score += 1;
          parsedQuestion.result = isCorrect;
        }
        return JSON.stringify(parsedQuestion);
      });

      const response = await this.database.updateDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        paperId,
        {
          questions: updatedQuestions,
          score,
          submitted: true,
        }
      );

      return response;
    } catch (error) {
      console.error("Error updating all responses:", error);
      throw error;
    }
  }

  async getUserResults(userId) {
    try {
      const response = await quesdbservice.listDocuments(
        this.databaseId,
        this.questionPapersCollectionId,
        [],
        {
          filters: [`userId=${userId}`, `submitted=true`],
        }
      );
      return response.documents;
    } catch (error) {
      console.error("Error getting user results:", error);
    }
  }

  async getQuestionPaperByUserId(userId) {
    try {
      const response = await this.database.listDocuments(
        this.databaseId,
        this.questionPapersCollectionId,
        [Query.equal("userId", userId)]
      );
      return response.documents;
    } catch (error) {
      console.error("Error getting question paper by user ID:", error);
      throw error;
    }
  }
}

const questionpaperservice = new QuestionPaperService();
export default questionpaperservice;
