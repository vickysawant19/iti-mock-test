import { getIndianTime } from '../utils/index.js';

export default async function updateAttendance(payload, { database, config }) {
  const { databaseId, newAttendanceCollectionId } = config;
  const { docId, status, remarks } = payload;
  if (!docId) {
    throw new Error('docId is required for updateAttendance');
  }

  const allowed = ['present', 'absent', 'leave', 'late'];
  if (status && !allowed.includes(status)) {
    throw new Error('Invalid status value');
  }

  const updatePayload = {
    updatedAt: getIndianTime(),
  };
  if (status) updatePayload.status = status;
  if (remarks) updatePayload.remarks = remarks;

  const updated = await database.updateDocument(
    databaseId,
    newAttendanceCollectionId,
    docId,
    updatePayload
  );

  return { updated };
}
