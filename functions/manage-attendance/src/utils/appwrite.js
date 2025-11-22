import { Query } from 'node-appwrite';

const BATCH_LIMIT = 100;

/**
 * Fetches all documents from a collection by handling pagination automatically.
 * @param {Databases} database - The Appwrite Databases service instance.
 * @param {string} databaseId - The ID of the database.
 * @param {string} collectionId - The ID of the collection.
 * @param {string[]} queries - An array of query strings.
 * @returns {Promise<Document[]>} - A promise that resolves to an array of all fetched documents.
 */
export async function fetchAllDocuments(
  database,
  databaseId,
  collectionId,
  queries = []
) {
  let documents = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await database.listDocuments(databaseId, collectionId, [
        ...queries,
        Query.limit(BATCH_LIMIT),
        Query.offset(offset),
      ]);

      if (response.documents.length > 0) {
        documents.push(...response.documents);
        offset += BATCH_LIMIT;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Failed to fetch documents from ${collectionId}:`, error);
      throw new Error(`Could not fetch all documents from ${collectionId}.`);
    }
  }

  return documents;
}
