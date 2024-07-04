import { Query } from "appwrite";
import quesdbservice from "./database";
import { appwriteService } from "./appwriteConfig";
import conf from "../config/config";

class QuestionPaperService {
    constructor() {
        this.database = appwriteService.getDatabases();
        this.databaseId = conf.databaseId;
        this.questionsCollectionId = conf.quesCollectionId;
        this.questionPapersCollectionId = conf.questionPapersCollectionId;
    }

    async generateQuestionPaper(userId, tradeId, year) {
        try {
            const questions = await quesdbservice.listQuestions([
                Query.equal("tradeId", tradeId),
                Query.equal("year", year)
            ]);

            const selectedQuestions = this.getRandomQuestions(questions.documents, 50);

            const questionsWithResponses = selectedQuestions.map(question => ({
                ...question,
                response: null
            }));

            const serializedQuestions = questionsWithResponses.map(question => JSON.stringify(question));

            const questionPaper = {
                userId,
                tradeId,
                year,
                questions: serializedQuestions,
                score: null,
                submitted: false
            };

            const response = await this.database.createDocument(
                this.databaseId,
                this.questionPapersCollectionId,
                'unique()',
                questionPaper
            );

            return response;
        } catch (error) {
            console.error('Error generating question paper:', error);
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
            console.error('Error getting question paper:', error);
        }
    }

    async updateResponse(paperId, questionId, selectedAnswer) {
        try {
            const paper = await this.getQuestionPaper(paperId);
            if (paper.submitted) {
                throw new Error('Cannot update responses for a submitted paper');
            }

            const updatedQuestions = paper.questions.map(question => {
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
            console.error('Error updating response:', error);
        }
    }

    async updateAllResponses(paperId, responses) {
        try {
            const paper = await this.getQuestionPaper(paperId);
            if (paper.submitted) {
                throw new Error('Cannot update responses for a submitted paper');
            }

            let score = 0;

            const updatedQuestions = paper.questions.map(question => {
                const parsedQuestion = JSON.parse(question);
                const response = responses.find(res => res.questionId === parsedQuestion.$id);
                if (response) {
                    parsedQuestion.response = response.selectedAnswer;
                    const isCorrect = parsedQuestion.response === parsedQuestion.correctAnswer;
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
                    submitted: true
                }
            );

            return response;
        } catch (error) {
            console.error('Error updating all responses:', error);
        }
    }

    async getUserResults(userId) {
        try {
            const response = await quesdbservice.listDocuments(
                this.databaseId,
                this.questionPapersCollectionId,
                [],
                {
                    filters: [`userId=${userId}`, `submitted=true`]
                }
            );
            return response.documents;
        } catch (error) {
            console.error('Error getting user results:', error);
        }
    }

    async getQuestionPaperByUserId(userId) {
        try {
            const response = await this.database.listDocuments(
                this.databaseId,
                this.questionPapersCollectionId,
                [Query.equal('userId', userId)],
            );
            return response.documents;
        } catch (error) {
            console.error('Error getting question paper by user ID:', error);
        }
    }
}

const questionpaperservice = new QuestionPaperService();
export default questionpaperservice;
