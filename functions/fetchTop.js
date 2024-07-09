import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_URL)
    .setProject(process.env.APPWRITE_PROJECT_ID);
  // .setKey(process.env.APPWRITE_API_KEY); // Ensure to set API key if necessary

  const database = new Databases(client);

  try {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Change this to get the top users for day, week, month as needed

    // Fetch questions from the database
    const questions = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_QUES_COLLECTION_ID
    );

    // Calculate the number of questions created by each user
    const userQuestionsCount = questions.documents.reduce((acc, doc) => {
      if (acc[doc.userId]) {
        acc[doc.userId].questionsCount += 1;
      } else {
        acc[doc.userId] = { userId: doc.userId, questionsCount: 1 };
      }
      return acc;
    }, {});

    // Convert userQuestionsCount object to array and sort by the number of questions in descending order
    const sortedUsers = Object.values(userQuestionsCount)
      .sort((a, b) => b.questionsCount - a.questionsCount)
      .slice(0, 5);

    // Fetch user details (assuming you have a user collection or can fetch from user API)
    const topUsers = await Promise.all(
      sortedUsers.map(async (user) => {
        const userDetails = await database.getDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION_ID,
          user.userId
        );
        return {
          userId: user.userId,
          userName: userDetails.name, // Assuming 'name' field contains the username
          questionsCount: user.questionsCount,
        };
      })
    );

    log(JSON.stringify(topUsers));
    return res.send(topUsers);
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
