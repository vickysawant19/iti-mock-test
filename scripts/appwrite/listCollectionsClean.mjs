import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

async function listCollections() {
    try {
        const res = await databases.listCollections('itimocktest');
        console.log('--- COLLECTIONS ---');
        res.collections.forEach(c => {
            console.log(`ID: ${c.$id} | Name: ${c.name}`);
        });
        console.log('-------------------');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listCollections();
