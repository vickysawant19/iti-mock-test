import { Query } from "node-appwrite";
import { fetchAllDocuments } from "./appwrite.js";

/**
 * Fetches existing attendance records for a specific batch and date.
 * @param {Databases} database - The Appwrite Databases service instance.
 * @param {string} databaseId - The ID of the database.
 * @param {string} newAttendanceCollectionId - The ID of the attendance collection.
 * @param {string} batchId - The ID of the batch.
 * @param {string} date - The date in YYYY-MM-DD format.
 * @returns {Promise<Map<string, Document>>} A map of userId to attendance document.
 */
export async function fetchExistingAttendanceForBatchDate(
  database,
  databaseId,
  newAttendanceCollectionId,
  batchId,
  date
) {
  try {
    const documents = await fetchAllDocuments(
      database,
      databaseId,
      newAttendanceCollectionId,
      [Query.equal("batchId", batchId), Query.equal("date", date)]
    );

    const map = new Map();
    documents.forEach((doc) => {
      if (doc.userId) map.set(doc.userId, doc);
    });
    return map;
  } catch (err) {
    throw new Error(`Failed to fetch existing attendance: ${err.message}`);
  }
}

/**
 * Creates attendance documents in batches.
 * @param {Databases} database - The Appwrite Databases service instance.
 * @param {string} databaseId - The ID of the database.
 * @param {string} newAttendanceCollectionId - The ID of the attendance collection.
 * @param {Object[]} docs - An array of attendance document data to create.
 * @returns {Promise<{created: number}>} An object containing the count of created documents.
 */
export async function bulkCreateAttendance(
  database,
  databaseId,
  newAttendanceCollectionId,
  docs
) {
  if (!Array.isArray(docs) || docs.length === 0) return { created: 0 };
  const BATCH_SIZE = 100;
  let created = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    try {
      await database.createDocuments(
        databaseId,
        newAttendanceCollectionId,
        chunk
      );
      created += chunk.length;
    } catch (err) {
      console.error(`Failed to create attendance chunk: ${err.message}`);
    }
  }
  return { created };
}
