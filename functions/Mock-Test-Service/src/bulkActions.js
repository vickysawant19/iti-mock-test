const bulkaddQuestions = async ({
  questions,
  error,
  database,
  ID,
  databaseId: passedDatabaseId,
  quesCollectionId: passedQuesCollectionId
}) => {
  try {
    const databaseId = passedDatabaseId || process.env.APPWRITE_DATABASE_ID || "itimocktest";
    const collectionId = passedQuesCollectionId || process.env.APPWRITE_QUES_COLLECTION_ID || "667932c5000ff8e2d769";

    const results = [];
    for (const q of questions) {
      const res = await database.createRow({
        databaseId,
        tableId: collectionId,
        rowId: ID.unique(),
        data: q
      });
      results.push(res.$id);
    }
    return { success: true, count: results.length, ids: results };
  } catch (err) {
    error("Bulk Add Error: " + err.message);
    return { error: err.message };
  }
}

export { bulkaddQuestions }