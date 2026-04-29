
import { Client, Databases } from 'node-appwrite';

const client = new Client();
client
    .setEndpoint('https://api.itimitra.in/v1')
    .setProject('itimocktest')
    .setKey('standard_95dec26d9fc1b965daba5add865d10732fec160a64cc0cce9e58ced724ec220f9f278c7c2d66fdca3b6b8f5ea5e7598afe69f8593851cb8bbe5071482bcf4a34f5998c4f16e7d3aa679a5d879a4e0fe42cfb02b26f5e35b572922dfc4f3bcc4fe04cd255165a1b3e69b19f52022084d48557f6de1236d80ce9be245c71fb87de');

const databases = new Databases(client);
const DATABASE_ID = 'itimocktest';
const QUESTIONS_COLLECTION_ID = '667932c5000ff8e2d769';

async function listIndexes() {
    try {
        const response = await databases.listIndexes(DATABASE_ID, QUESTIONS_COLLECTION_ID);
        console.log("Current Indexes:", response.indexes.map(idx => idx.key));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listIndexes();
