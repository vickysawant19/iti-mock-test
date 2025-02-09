import { Client,Databases } from 'node-appwrite';
import createNewMockTest from "./createNewMockTest.js";
import generateMockTest from "./generateMockTest.js";



export default async ({ req, res, log, error }) => {
  if (!req.body) {
    throw new Error("Request body is required");
  }
  const {
    action,
    userId,
    userName,
    tradeName,
    tradeId,
    year,
    quesCount,
    paperId,
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
      });
      break;

    case "createNewMockTest":
      result = await createNewMockTest({
        paperId,
        userId,
        userName,
        error,
        database,
      });
      break;

    default:
      result = { error: "Invalid action" };
      break;
  }
  return res.send(result);
};
