import { Client, Databases, Query, ID } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const trimValue = (val) => val ? val.trim().replace(/^["'](.+)["']$/, '$1') : val;

const client = new Client()
    .setEndpoint(trimValue(process.env.VITE_APPWRITE_URL))
    .setProject(trimValue(process.env.VITE_APPWRITE_PROJECT_ID))
    .setKey(trimValue(process.env.VITE_APPWRITE_API_KEY));

const databases = new Databases(client);

const databaseId = trimValue(process.env.VITE_APPWRITE_DATABASE_ID);
const batchesCollectionId = trimValue(process.env.VITE_BATCH_COLLECTION_ID);
const batchStudentsCollectionId = "batchStudents"; // New collection ID

async function migrate() {
    try {
        console.log("Starting migration...");
        
        const dbList = await databases.list();
        console.log("Available databases:", dbList.databases.map(d => `${d.name} (${d.$id})`));

        if (!dbList.databases.some(d => d.$id === databaseId)) {
            console.error(`Database ${databaseId} not found in the list!`);
            return;
        }

        let offset = 0;
        let limit = 100;
        let totalProcessed = 0;
        let totalMoved = 0;

        while (true) {
            const batches = await databases.listDocuments(
                databaseId,
                batchesCollectionId,
                [Query.limit(limit), Query.offset(offset)]
            );

            if (batches.documents.length === 0) break;

            for (const batch of batches.documents) {
                const batchId = batch.$id;
                const studentIdsArray = batch.studentIds || [];

                console.log(`Processing batch: ${batch.BatchName} (${batchId}) - ${studentIdsArray.length} students`);

                for (const studentJson of studentIdsArray) {
                    try {
                        const studentData = JSON.parse(studentJson);
                        const studentId = studentData.userId; // Use userId as studentId

                        if (!studentId) {
                            console.warn(`Skipping student with no userId in batch ${batchId}`);
                            continue;
                        }

                        // Check if already exists in batchStudents
                        const existing = await databases.listDocuments(
                            databaseId,
                            batchStudentsCollectionId,
                            [
                                Query.equal("batchId", batchId),
                                Query.equal("studentId", studentId)
                            ]
                        );

                        if (existing.total === 0) {
                            await databases.createDocument(
                                databaseId,
                                batchStudentsCollectionId,
                                ID.unique(),
                                {
                                    batchId,
                                    studentId,
                                    joinedAt: batch.$createdAt || new Date().toISOString()
                                }
                            );
                            totalMoved++;
                        } else {
                            // console.log(`Student ${studentId} already in batch ${batchId}`);
                        }
                    } catch (e) {
                        console.error(`Error parsing student JSON in batch ${batchId}:`, e.message);
                    }
                }
                totalProcessed++;
            }

            offset += limit;
            if (batches.documents.length < limit) break;
        }

        console.log(`Migration complete!`);
        console.log(`Total batches processed: ${totalProcessed}`);
        console.log(`Total students moved: ${totalMoved}`);

    } catch (error) {
        console.error("Migration failed:", error.message);
    }
}

migrate();
