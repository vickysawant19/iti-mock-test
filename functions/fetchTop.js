import { Client, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_URL)
    .setProject(process.env.APPWRITE_PROJECT_ID);
  // .setKey(process.env.APPWRITE_API_KEY); // Ensure to set API key if necessary

  const database = new Databases(client);

  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    ).toISOString();
    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    ).toISOString();

    const getContributers = async (startDate) => {
      // Fetch questions from the database
      const questions = await database.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_QUES_COLLECTION_ID,
        [Query.greaterThanEqual("$createdAt", startDate)]
      );

      // Calculate the number of questions created by each user
      const userQuestionsCount = questions.documents.reduce((acc, doc) => {
        if (acc[doc.userId]) {
          acc[doc.userId].questionsCount += 1;
        } else {
          acc[doc.userId] = {
            userName: doc.userName,
            userId: doc.userId,
            questionsCount: 1,
          };
        }
        return acc;
      }, {});
      // Convert userQuestionsCount object to array and sort by the number of questions in descending order
      const sortedUsers = Object.values(userQuestionsCount)
        .sort((a, b) => b.questionsCount - a.questionsCount)
        .slice(0, 5);

      return sortedUsers;
    };

    const dayContributers = getContributers(startOfDay);
    const weeekContributers = getContributers(startOfWeek);
    const monthContributers = getContributers(startOfMonth);

    log(
      JSON.stringify({ dayContributers, monthContributers, weeekContributers })
    );

    return res.send({ dayContributers, monthContributers, weeekContributers });
  } catch (err) {
    error(err);
    return res.json({ error: err.message });
  }
};
