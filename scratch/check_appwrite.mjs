
import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const client = new Client();
client
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://auth.itimitra.in/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.VITE_APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function checkAttributes() {
    try {
        console.log("Checking Questions Collection Attributes...");
        const quesAttributes = await databases.listAttributes('itimocktest', '667932c5000ff8e2d769');
        console.log("Questions Attributes:", quesAttributes.attributes.map(a => a.key));

        console.log("\nChecking Modules Collection Attributes...");
        const moduleAttributes = await databases.listAttributes('itimocktest', 'newmodulesdata');
        console.log("Modules Attributes:", moduleAttributes.attributes.map(a => a.key));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkAttributes();
