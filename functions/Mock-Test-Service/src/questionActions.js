import { Query } from "node-appwrite";

/**
 * Creates a single question in the database.
 * Enforces duplication check.
 */
const createQuestion = async ({
  payload,
  error,
  database,
  ID,
  databaseId: passedDatabaseId,
  quesCollectionId: passedQuesCollectionId
}) => {
  try {
    const databaseId = passedDatabaseId || process.env.APPWRITE_DATABASE_ID || "itimocktest";
    const collectionId = passedQuesCollectionId || process.env.APPWRITE_QUES_COLLECTION_ID || "667932c5000ff8e2d769";

    if (!payload || !payload.question) {
      throw new Error("Question text is required.");
    }
    if (!payload.options || !Array.isArray(payload.options) || payload.options.length < 2) {
      throw new Error("At least two options are required.");
    }
    if (!payload.correctAnswer) {
      throw new Error("Correct answer is required.");
    }

    // Check if duplicate question exists
    const existing = await database.listRows({
      databaseId,
      tableId: collectionId,
      queries: [
        Query.equal("question", payload.question),
        Query.limit(1),
        Query.select(["$id"])
      ]
    });

    const rows = existing.rows || existing.documents || [];
    if ((existing.total ?? rows.length) > 0 && rows.length > 0) {
      throw new Error("The question already exists in the database.");
    }

    const response = await database.createRow({
      databaseId,
      tableId: collectionId,
      rowId: ID.unique(),
      data: payload
    });

    return response;
  } catch (err) {
    error("Create Question Error: " + err.message);
    return { error: err.message };
  }
};

/**
 * Updates an existing question in the database.
 */
const updateQuestion = async ({
  id,
  payload,
  error,
  database,
  databaseId: passedDatabaseId,
  quesCollectionId: passedQuesCollectionId
}) => {
  try {
    const databaseId = passedDatabaseId || process.env.APPWRITE_DATABASE_ID || "itimocktest";
    const collectionId = passedQuesCollectionId || process.env.APPWRITE_QUES_COLLECTION_ID || "667932c5000ff8e2d769";

    if (!id) {
      throw new Error("Question ID is required for updates.");
    }
    if (!payload) {
      throw new Error("Payload is required for updates.");
    }

    const response = await database.updateRow({
      databaseId,
      tableId: collectionId,
      rowId: id,
      data: payload
    });

    return response;
  } catch (err) {
    error("Update Question Error: " + err.message);
    return { error: err.message };
  }
};

/**
 * Deletes a single question from the database.
 */
const deleteQuestion = async ({
  id,
  error,
  database,
  databaseId: passedDatabaseId,
  quesCollectionId: passedQuesCollectionId
}) => {
  try {
    const databaseId = passedDatabaseId || process.env.APPWRITE_DATABASE_ID || "itimocktest";
    const collectionId = passedQuesCollectionId || process.env.APPWRITE_QUES_COLLECTION_ID || "667932c5000ff8e2d769";

    if (!id) {
      throw new Error("Question ID is required for deletion.");
    }

    await database.deleteRow({
      databaseId,
      tableId: collectionId,
      rowId: id
    });

    return { success: true };
  } catch (err) {
    error("Delete Question Error: " + err.message);
    return { error: err.message };
  }
};

/**
 * Performs bulk updates on questions.
 * Expects array of { id, data }.
 */
const bulkUpdateQuestions = async ({
  updates,
  error,
  database,
  databaseId: passedDatabaseId,
  quesCollectionId: passedQuesCollectionId
}) => {
  try {
    const databaseId = passedDatabaseId || process.env.APPWRITE_DATABASE_ID || "itimocktest";
    const collectionId = passedQuesCollectionId || process.env.APPWRITE_QUES_COLLECTION_ID || "667932c5000ff8e2d769";

    if (!Array.isArray(updates)) {
      throw new Error("Updates must be an array of { id, data }.");
    }

    const results = [];
    for (const item of updates) {
      if (!item.id || !item.data) {
        throw new Error("Each update item must contain both id and data fields.");
      }
      const res = await database.updateRow({
        databaseId,
        tableId: collectionId,
        rowId: item.id,
        data: item.data
      });
      results.push(res.$id);
    }

    return { success: true, count: results.length, ids: results };
  } catch (err) {
    error("Bulk Update Error: " + err.message);
    return { error: err.message };
  }
};

/**
 * Performs bulk deletion of questions.
 * Expects array of strings (question IDs).
 */
const bulkDeleteQuestions = async ({
  ids,
  error,
  database,
  databaseId: passedDatabaseId,
  quesCollectionId: passedQuesCollectionId
}) => {
  try {
    const databaseId = passedDatabaseId || process.env.APPWRITE_DATABASE_ID || "itimocktest";
    const collectionId = passedQuesCollectionId || process.env.APPWRITE_QUES_COLLECTION_ID || "667932c5000ff8e2d769";

    if (!Array.isArray(ids)) {
      throw new Error("IDs must be an array of strings.");
    }

    for (const id of ids) {
      await database.deleteRow({
        databaseId,
        tableId: collectionId,
        rowId: id
      });
    }

    return { success: true, count: ids.length };
  } catch (err) {
    error("Bulk Delete Error: " + err.message);
    return { error: err.message };
  }
};

export {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUpdateQuestions,
  bulkDeleteQuestions
};
