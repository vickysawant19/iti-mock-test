import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const collectionId = process.env.VITE_TRADE_COLLECTION_ID || "667e7755002efc107f60";

const tradeMappings = {
    "Electrician": "231",
    "Fitter": "227",
    "Welder": "312",
    "Turner": "578",
    "Machinist": "493",
    "Wireman": "592",
    "Mechanic Motor Vehicle": "502",
    "Instrument Mechanic": "477",
    "Electronics Mechanic": "446",
    "Plumber": "543",
    "Civil Engineer Assistant": "416",
    "Architectural Draughtsman": "990",
    "Architectural Assistant": "AA_TEMP",
    "CAD Technician": "1035",
    "CNC Operator": "1001",
    "Computer Operator and Programming Assistant (COPA)": "242",
    "Computer Operator and Programming Assistant": "242",
    "Computer Hardware and Network Maintenance": "418",
    "Information Technology": "475",
    "Auto Electrician": "509",
    "Automobile Technician": "AUTO_TECH",
    "Mechanic Electric Vehicle": "1002",
    "Carpenter": "CARP_TEMP",
    "Mason (Building Constructor)": "499",
    "Pump Operator Mechanic": "547",
    "Marine Fitter": "497",
    "Foundryman Technician": "460",
    "Attendant Operator (Chemical Plant)": "406",
    "Cable Jointer": "CABLE_TEMP",
    "Armature Winder": "ARM_TEMP",
    "Biomedical Instrumentation Technician": "995",
    "Refrigeration and Air Conditioning Technician": "998",
    "Basic Cosmetology": "409",
    "Cutting and Sewing": "1031",
    "Digital Photographer": "433",
    "Catering and Restaurant Management": "415",
    "Agro Processing": "402",
    "Rice Mill Operator": "RICE_TEMP",
    "Boiler Attendant": "BOILER_TEMP",
    "Chemical Technician": "485"
};

async function migrateTradeCodes() {
    console.log("Starting migration of official trade codes...");
    try {
        const res = await databases.listDocuments(databaseId, collectionId, [Query.limit(100)]);
        
        for (const doc of res.documents) {
            const name = doc.tradeName;
            const code = tradeMappings[name] || `T_${name.substring(0, 4).toUpperCase()}`;
            
            console.log(`Updating "${name}" with code "${code}"...`);
            await databases.updateDocument(databaseId, collectionId, doc.$id, {
                tradeCode: code
            });
        }
        
        console.log("Migration complete!");
    } catch (err) {
        console.error("Migration failed:", err.message);
    }
}

migrateTradeCodes();
