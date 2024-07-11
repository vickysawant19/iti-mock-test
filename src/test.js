import { Client, Databases, Permission, Role } from "node-appwrite";
import conf from "./config/config";

const client = new Client();
client.setEndpoint(conf.appwriteUrl).setProject(conf.projectId);
// Ensure you have the API key set

const databases = new Databases(client);

const createCollection = async () => {
  try {
    const response = await databases.createCollection(
      conf.databaseId,
      "userStats",
      "User Stats",
      [
        Permission.read(Role.any()), // Read permissions for all users
        Permission.write(Role.member()), // Write permissions for logged-in users
      ]
    );

    const attributes = [
      { id: "userId", type: "string", size: 255, required: true },
      { id: "userName", type: "string", size: 255, required: true },
      { id: "day_questionsCount", type: "integer" },
      { id: "day_testsCount", type: "integer" },
      { id: "day_maxScore", type: "integer" },
      { id: "week_questionsCount", type: "integer" },
      { id: "week_testsCount", type: "integer" },
      { id: "week_maxScore", type: "integer" },
      { id: "month_questionsCount", type: "integer" },
      { id: "month_testsCount", type: "integer" },
      { id: "month_maxScore", type: "integer" },
      { id: "year_questionsCount", type: "integer" },
      { id: "year_testsCount", type: "integer" },
      { id: "year_maxScore", type: "integer" },
      { id: "allTime_questionsCount", type: "integer" },
      { id: "allTime_testsCount", type: "integer" },
      { id: "allTime_maxScore", type: "integer" },
    ];

    for (const attribute of attributes) {
      await databases.createStringAttribute(
        process.env.APPWRITE_DATABASE_ID,
        response.$id,
        attribute.id,
        attribute.size,
        attribute.required
      );
    }

    console.log("Collection and attributes created successfully");
  } catch (error) {
    console.error("Error creating collection or attributes:", error);
  }
};

export default createCollection;
