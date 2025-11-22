import { Query, ID } from 'node-appwrite';
import { isoDateOnly, getIndianTime } from '../utils/index.js';

export default async function markPresent(
  payload,
  { database, config, today }
) {
  const { databaseId, newAttendanceCollectionId } = config;
  const {
    userId,
    batchId,
    date: dateInput,
    markedBy = 'system',
    remarks = '',
  } = payload;
  if (!userId || !batchId) {
    throw new Error('userId and batchId are required for markPresent');
  }

  const date = dateInput ? isoDateOnly(new Date(dateInput)) : today;

  const existResp = await database.listDocuments(
    databaseId,
    newAttendanceCollectionId,
    [
      Query.equal('userId', userId),
      Query.equal('batchId', batchId),
      Query.equal('date', date),
      Query.limit(1),
    ]
  );

  if (existResp.total > 0 && existResp.documents.length > 0) {
    const doc = existResp.documents[0];
    await database.updateDocument(
      databaseId,
      newAttendanceCollectionId,
      doc.$id,
      {
        status: 'present',
        markedBy,
        remarks,
        updatedAt: getIndianTime(),
      }
    );
    return { message: 'Attendance updated to present', docId: doc.$id };
  } else {
    const created = await database.createDocument(
      databaseId,
      newAttendanceCollectionId,
      ID.unique(),
      {
        userId,
        batchId,
        date,
        status: 'present',
        markedBy,
        remarks,
        createdAt: getIndianTime(),
      }
    );
    return { message: 'Attendance created as present', created };
  }
}
