import { Client, Databases, Query, ID } from 'node-appwrite';
import config from '../config/index.js';
import { fetchAllDocuments } from './appwrite.js';

const DEFAULT_BATCH_SIZE = 100;

export function isoDateOnly(d = new Date(getIndianTime())) {
  return d.toISOString().split('T')[0];
}

export function getIndianTime() {
  const utcDate = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
  const istTime = new Date(utcDate.getTime() + istOffset * 60 * 1000);
  return istTime.toISOString();
}

export async function fetchActiveBatches(database) {
  const { databaseId, batchesCollectionId } = config;
  try {
    const resp = await fetchAllDocuments(
      database,
      databaseId,
      batchesCollectionId,
      [
        Query.equal('isActive', true),
        Query.select(['$id', 'BatchName', 'tradeId', 'studentIds']),
      ]
    );

    return resp || [];
  } catch (err) {
    throw new Error(`Failed to list batches: ${err.message}`);
  }
}

export function extractUserIdsFromBatchDoc(batchDoc) {
  const raw = batchDoc?.studentIds ?? [];
  if (!Array.isArray(raw)) return [];
  const userIds = new Set();
  raw.forEach((entry) => {
    try {
      if (!entry) return;
      if (typeof entry === 'string') {
        if (entry.startsWith('{') || entry.startsWith('[')) {
          const parsed = JSON.parse(entry);
          if (parsed?.userId) userIds.add(parsed.userId);
          else if (typeof parsed === 'string') userIds.add(parsed);
        } else {
          userIds.add(entry);
        }
      }
    } catch (e) {
      if (typeof entry === 'string') userIds.add(entry);
    }
  });
  return Array.from(userIds);
}

export async function fetchExistingAttendanceForBatchDate(
  database,
  batchId,
  date
) {
  const { databaseId, newAttendanceCollectionId } = config;
  try {
    const resp = await fetchAllDocuments(
      database,
      databaseId,
      newAttendanceCollectionId,
      [Query.equal('batchId', batchId), Query.equal('date', date)]
    );

    const map = new Map();
    (resp || []).forEach((doc) => {
      if (doc.userId) map.set(doc.userId, doc);
    });
    return map;
  } catch (err) {
    throw new Error(`Failed to fetch existing attendance: ${err.message}`);
  }
}

export async function bulkCreateAttendance(docs, database, log, error) {
  const { databaseId, newAttendanceCollectionId } = config;
  if (!Array.isArray(docs) || docs.length === 0) return { created: 0 };
  let created = 0;
  for (let i = 0; i < docs.length; i += DEFAULT_BATCH_SIZE) {
    const chunk = docs.slice(i, i + DEFAULT_BATCH_SIZE);
    try {
      const resp = await database.createDocuments(
        databaseId,
        newAttendanceCollectionId,
        chunk
      );
      created += Array.isArray(resp) ? resp.length : chunk.length;
      log(`Bulk created ${chunk.length} attendance documents`);
    } catch (err) {
      error(`Failed to create attendance chunk: ${err.message}`);
    }
  }
  return { created };
}
