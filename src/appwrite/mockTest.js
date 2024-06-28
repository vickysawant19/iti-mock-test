import quesdbservice from "./database";



class QuestionPaperService {
    constructor() {
        this.databaseId = 'YOUR_DATABASE_ID';
        this.questionsCollectionId = 'YOUR_QUESTIONS_COLLECTION_ID';
        this.questionPapersCollectionId = 'YOUR_QUESTION_PAPERS_COLLECTION_ID';
    }

    async generateQuestionPaper(tradeId, year) {
        try {
            // Fetch questions filtered by tradeId and year
            const questions = await quesdbservice.listDocuments(this.databaseId, this.questionsCollectionId, [], {
                filters: [`tradeId=${tradeId}`, `year=${year}`]
            });
            
            // Randomly select 50 questions
            const selectedQuestions = this.getRandomQuestions(questions.documents, 50);

            // Initialize responses with null for each question
            const responses = selectedQuestions.map(question => ({
                questionId: question.$id,
                selectedAnswer: null
            }));

            // Create a new question paper document
            const questionPaper = {
                tradeId,
                year,
                questions: selectedQuestions,
                responses,
                score: null, // Initially null, will be updated upon submission
                submitted: false, // To indicate if the paper is submitted
                createdAt: new Date().toISOString()
            };

            const response = await quesdbservice.createDocument(this.databaseId, this.questionPapersCollectionId, 'unique()', questionPaper);
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

export default QuestionPaperService;
