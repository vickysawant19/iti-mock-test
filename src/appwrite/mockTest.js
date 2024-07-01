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
            // Fetch questions filtered by tradeId and year
            const questions = await quesdbservice.listQuestions([Query.equal("tradeId",tradeId),Query.equal("year",year)]);
            console.log(questions);
            
            // Randomly select 50 questions
            const selectedQuestions = this.getRandomQuestions(questions.documents, 50);
            console.log("quess",selectedQuestions);

            const serializedQuestions = selectedQuestions.map(question => JSON.stringify(question));


            // Initialize responses with null for each question
            const responses = selectedQuestions.map(question => ({
                questionId: question.$id,
                selectedAnswer: null
            }));

            const serializedResponses = responses.map(res => JSON.stringify(res))

            // Create a new question paper document
            const questionPaper = {
                userId,
                tradeId,
                year,
                questions: serializedQuestions,
                responses: serializedResponses,
                score: null, // Initially null, will be updated upon submission
                submitted: false, // To indicate if the paper is submitted
            };
            const response = await this.database.createDocument(this.databaseId, this.questionPapersCollectionId, 'unique()', questionPaper);
            console.log(response);
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
            const response = await quesdbservice.getDocument(this.databaseId, this.questionPapersCollectionId, paperId);
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

            const updatedResponses = paper.responses.map(response => 
                response.questionId === questionId ? { ...response, selectedAnswer } : response
            );

            const response = await quesdbservice.updateDocument(this.databaseId, this.questionPapersCollectionId, paperId, {
                responses: updatedResponses
            });

            return response;
        } catch (error) {
            console.error('Error updating response:', error);
        }
    }

    async submitQuestionPaper(paperId, score) {
        try {
            const paper = await this.getQuestionPaper(paperId);
            if (paper.submitted) {
                throw new Error('Paper has already been submitted');
            }

            const response = await quesdbservice.updateDocument(this.databaseId, this.questionPapersCollectionId, paperId, {
                score,
                submitted: true
            });

            return response;
        } catch (error) {
            console.error('Error submitting question paper:', error);
        }
    }

    async getUserResults(userId) {
        try {
            const response = await quesdbservice.listDocuments(this.databaseId, this.questionPapersCollectionId, [], {
                filters: [`userId=${userId}`, `submitted=true`]
            });
            return response.documents;
        } catch (error) {
            console.error('Error getting user results:', error);
        }
    }

    async getQuestionPaperByUserId(userId) {
        try {
            const response = await quesdbservice.listDocuments(this.databaseId, this.questionPapersCollectionId, [], {
                filters: [`userId=${userId}`]
            });
            return response.documents;
        } catch (error) {
            console.error('Error getting question paper by user ID:', error);
        }
    }
}
const questionpaperservice = new QuestionPaperService;
export default questionpaperservice;
