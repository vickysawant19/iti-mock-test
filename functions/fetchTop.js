import { Client, Account, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_URL)
    .setProject(process.env.APPWRITE_PROJECT_ID);

  const database = new Databases(client);

  try {
    const res = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_QUES_COLLECTION_ID
    );
    log(JSON.stringify(res));
    return res.json(res);
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
