import { Query } from 'node-appwrite';
import { isoDateOnly } from '../utils/index.js';

export default async function cleanupOld(payload, { database, config, error }) {
  const { databaseId, newAttendanceCollectionId } = config;
  const olderThanDays = Number(payload.olderThanDays ?? 30);
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 3600 * 1000);
  const cutoffDate = isoDateOnly(cutoff);

  const found = await database.listDocuments(
    databaseId,
    newAttendanceCollectionId,
    [Query.lessThan('date', cutoffDate), Query.limit(1000)]
  );

  const docs = found.documents || [];
  let deleted = 0;
  for (const d of docs) {
    try {
      await database.deleteDocument(
        databaseId,
        newAttendanceCollectionId,
        d.$id
      );
      deleted++;
    } catch (e) {
      error(`Failed to delete attendance ${d.$id}: ${e.message}`);
    }
  }
  return { deleted };
}
