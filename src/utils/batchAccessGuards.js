/**
 * Utility functions for checking access control based on the global active batch.
 */

export const canAccessAttendance = (activeBatchId) => {
  return !!activeBatchId;
};

export const canAccessAssignments = (activeBatchId) => {
  return !!activeBatchId;
};

export const canAccessModule = (activeBatchId, moduleName) => {
  // Expandable for future module-level access control if needed
  return !!activeBatchId;
};
