const conf = {
    appwriteUrl: String(import.meta.env.VITE_APPWRITE_URL),
    projectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    databaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    quesCollectionId: String(import.meta.env.VITE_APPWRITE_QUES_COLLECTION_ID),
    mockTestCollectionId:String(import.meta.env.VITE_MOCKTEST_COLLECTION_ID),
    tradeCollectionId:String(import.meta.env.VITE_TRADE_COLLECTION_ID),
    bucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
  };

  
  export default conf;