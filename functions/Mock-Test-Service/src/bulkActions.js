
const bulkaddQuestions = async ( {
          questions,
          error,
          database,
        }) => {   
    try {
      const response = await database.createDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_QUES_COLLECTION_ID,
        questions
      );
      return response
    } catch (err) {
      error(err);
      return { error: err.message };
    }
    
}

export {bulkaddQuestions}