import { Query } from 'node-appwrite';
import { fetchAllDocuments } from './appwrite.js';
import config from '../config/index.js';

/**
 * Fetches all holidays for a specific date and organizes them by batchId.
 * @param {Databases} database - The Appwrite Databases service instance.
 * @param {string} databaseId - The ID of the database.
 * @param {string} holidaysCollectionId - The ID of the holidays collection.
 * @param {string} date - The date in YYYY-MM-DD format.
 * @returns {Promise<Map<string, Document>>} A map of batchId to holiday document.
 */
export async function fetchHolidaysForDate(database, date) {
  const { databaseId, holidaysCollectionId } = config;

  try {
    const documents = await fetchAllDocuments(
      database,
      databaseId,
      holidaysCollectionId,
      [Query.equal('date', date)]
    );
    console.log('Fetched ', date, databaseId, holidaysCollectionId);
    const holidayMap = new Map();
    documents.forEach((doc) => {
      if (doc.batchId) {
        // If multiple holidays are set for the same batch, the last one wins.
        holidayMap.set(doc.batchId, doc);
      }
    });
    return holidayMap;
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    throw new Error('Could not fetch holidays for the specified date.');
  }
}
