import { Client, Databases, ID } from 'node-appwrite';
import createNewMockTest from "./createNewMockTest.js";
import generateMockTest from "./generateMockTest.js";
import generateMockTestNew from "./generateMockTestNew.js";
import { bulkaddQuestions } from './bulkActions.js';



export default async ({ req, res, log, error }) => {

  if (req.method === 'OPTIONS') {
    return res.send('', 200, {
      'Access-Control-Allow-Origin': 'https://itimitra.in',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
  }
  
  
  if (!req.body) {
    throw new Error("Request body is required");
  }
  const {
    action,
    userId,
    userName,
    tradeName,
    tradeId,
    subjectId,
    subjectIds,
    year,
    quesCount,
    paperId,
    selectedModules,
    selectedQuestions,
    totalMinutes,
    tags,
    mode,
    title,
    negativeMarking,
    visibility,
    difficultyLevel,
    questions,
    databaseId,
    quesCollectionId,
    questionPapersCollectionId,
    newModulesDataCollectionId
  } = req.bodyJson;
  

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const database = new Databases(client);

  
  let result = {};
  switch (action) {
    case "generateMockTest":
      result = await generateMockTest({
        userId,
        userName,
        tradeName,
        tradeId,
        year,
        quesCount,
        error,
        database,
        selectedModules,
        subjectId,
        totalMinutes,
        tags,
        databaseId,
        quesCollectionId,
        questionPapersCollectionId,
        newModulesDataCollectionId
      
      });
      break;

    case "generateMockTestNew":
      result = await generateMockTestNew({
        userId,
        userName,
        tradeName,
        tradeId,
        year,
        mode,
        subjectId,
        subjectIds,
        selectedModules,
        selectedQuestions,
        quesCount,
        totalMinutes,
        title,
        negativeMarking,
        visibility,
        difficultyLevel,
        tags,
        error,
        database,
        databaseId,
        quesCollectionId,
        questionPapersCollectionId,
        newModulesDataCollectionId,
      });
      break;

    case "createNewMockTest":
      result = await createNewMockTest({
        paperId,
        userId,
        userName,
        error,
        database,  
        databaseId,
        questionPapersCollectionId
      });
      break;

      case "bulkaddQuestions":
        result = await bulkaddQuestions({
          questions,
          error,
          database,
          ID,
          databaseId,
          quesCollectionId
        });
        break;
    

    default:
      result = { error: "Invalid action" };
      break;
  }
  return res.send(result);
};
