const conf = {
  appwriteUrl: String(import.meta.env.VITE_APPWRITE_URL),
  projectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
  databaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
  quesCollectionId: String(import.meta.env.VITE_APPWRITE_QUES_COLLECTION_ID),
  questionPapersCollectionId: String(
    import.meta.env.VITE_QUESTIONPAPER_COLLECTION_ID
  ),
  tradeCollectionId: String(import.meta.env.VITE_TRADE_COLLECTION_ID),
  bucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
  userStatsCollectionId: String(import.meta.env.VITE_USER_STATS_COLLECTION_ID),
  userProfilesCollectionId: String(
    import.meta.env.VITE_USER_PROFILE_COLLECTION_ID
  ),
  batchesCollectionId: String(import.meta.env.VITE_BATCH_COLLECTION_ID),
  collegeTradeCollectionId: String(
    import.meta.env.VITE_COLLEGE_TRADE_COLLECTION_ID
  ),
  collegesCollectionId: String(import.meta.env.VITE_COLLEGE_COLLECTION_ID),
  subjectsCollectionId: String(import.meta.env.VITE_SUBJECTS_COLLECTION_ID),
  modulesesCollectionId: String(import.meta.env.VITE_MODULES_COLLECTION_ID),
  mockTestFunctionId: String(import.meta.env.VITE_MOCKTEST_FUNCTION_ID),
  studentAttendanceCollectionId: String(
    import.meta.env.VITE_ATTAINDANCE_COLLECTION_ID
  ),
  faceAttendanceCollectionId: String("6800d3c9000712f842e3"),
  newAttendanceCollectionId: String(import.meta.env.VITE_NEW_ATTENDANCE_COLLECTION_ID),
};

export default conf;
