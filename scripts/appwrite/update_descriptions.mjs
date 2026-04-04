import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = 'itimocktest';
const collectionId = '667e7755002efc107f60';

const updates = [
    {
        name: "Computer Operator and Programming Assistant (COPA)",
        searchName: "Computer Operator",
        description: "A one-year course focused on basic computer hardware, software installation, and programming."
    },
    {
        name: "Electronics Mechanic",
        searchName: "Electronics Mechanic",
        description: "A two-year program covering the repair and maintenance of electronic equipment and gadgets."
    },
    {
        name: "Refrigeration and Air Conditioning Technician",
        searchName: "Refrigeration",
        description: "A two-year technical course specializing in installing and servicing cooling systems like ACs and fridges."
    },
    {
        name: "Mechanic Electric Vehicle",
        searchName: "Electric Vehicle",
        description: "A two-year modern trade that trains students in the maintenance and repair of electrical vehicle systems."
    }
];

async function updateDescriptions() {
    console.log('--- Updating Trade Descriptions ---');
    try {
        const res = await databases.listDocuments(databaseId, collectionId);
        const docs = res.documents;

        for (const update of updates) {
            const doc = docs.find(d => 
                d.tradeName.toLowerCase().includes(update.searchName.toLowerCase())
            );

            if (doc) {
                console.log(`[+] Updating ${doc.tradeName}...`);
                await databases.updateDocument(databaseId, collectionId, doc.$id, {
                    description: update.description
                });
                console.log(`    Successfully updated ${doc.tradeName}`);
            } else {
                console.log(`[!] Could not find document matching: ${update.name}`);
            }
        }
    } catch (e) {
        console.error('Error during update:', e.message);
    }
    console.log('--- Finished ---');
}

updateDescriptions();
