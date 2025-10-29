import { Client,Databases  } from 'node-appwrite';
import createNewMockTest from "./createNewMockTest.js";
import generateMockTest from "./generateMockTest.js";
import { bulkaddQuestions } from './bulkActions.js';



export default async ({ req, res, log, error }) => {

  if (req.method === 'OPTIONS') {
    return res.send('', 200, {
      'Access-Control-Allow-Origin': 'https://itimocktest.vercel.app',
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
    year,
    quesCount,
    paperId,
    selectedModules,
    totalMinutes,
    tags,
    questions
  } = req.bodyJson;
  

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const database = new Databases(client);

  
  try {
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
          tags
        
        });
        break;
      case "createNewMockTest":
        result = await createNewMockTest({ paperId, userId, userName, error, database });
        break;
      case "bulkaddQuestions":
        result = await bulkaddQuestions({ questions, error, database });
        break;
      default:
        result = { error: "Invalid action" };
        break;
    }
    return res.send(result);
  } catch (err) {
    error(err);
    return res.send({ error: err.message }, 500);
  }
};
