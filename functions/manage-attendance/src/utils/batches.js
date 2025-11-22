import { Query } from "node-appwrite";
import { fetchAllDocuments } from "./appwrite.js";

/**
 * Fetches all active batches.
 * @param {Databases} database - The Appwrite Databases service instance.
 * @param {string} databaseId - The ID of the database.
 * @param {string} batchesCollectionId - The ID of the batches collection.
 * @returns {Promise<Document[]>} A promise that resolves to an array of active batch documents.
 */
export async function fetchActiveBatches(
  database,
  databaseId,
  batchesCollectionId
) {
  try {
    return await fetchAllDocuments(database, databaseId, batchesCollectionId, [
      Query.equal("isActive", true),
    ]);
  } catch (err) {
    throw new Error(`Failed to list batches: ${err.message}`);
  }
}

/**
 * Extracts and normalizes student userIds from a batch document.
 * @param {Document} batchDoc - The batch document.
 * @returns {string[]} An array of student user IDs.
 */
export function extractUserIdsFromBatchDoc(batchDoc) {
  const raw = batchDoc?.studentIds ?? [];
  if (!Array.isArray(raw)) return [];
  const userIds = new Set();
  raw.forEach((entry) => {
    try {
      if (!entry) return;
      if (typeof entry === "string") {
        if (entry.startsWith("{") || entry.startsWith("[")) {
          const parsed = JSON.parse(entry);
          if (parsed?.userId) userIds.add(parsed.userId);
        } else {
          userIds.add(entry);
        }
      } else if (typeof entry === "object" && entry.userId) {
        userIds.add(entry.userId);
      }
    } catch (e) {
      if (typeof entry === "string") userIds.add(entry);
    }
  });
  return Array.from(userIds);
}
