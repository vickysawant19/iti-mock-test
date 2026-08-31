import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || "");

const databases = new Databases(client);

async function listAllCollections() {
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

listAllCollections();
