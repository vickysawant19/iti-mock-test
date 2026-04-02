import { Client, Databases, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const collectionId = process.env.VITE_TRADE_COLLECTION_ID || "667e7755002efc107f60";

const tradesData = [
    { code: "231", name: "Electrician", duration: 2, description: "Training in installation, maintenance, and repair of electrical systems used in residential and industrial environments." },
    { code: "227", name: "Fitter", duration: 2, description: "Focuses on assembling, fitting, and repairing metal parts for various machinery and equipment." },
    { code: "312", name: "Welder", duration: 1, description: "Skills in joining metal parts using various welding techniques like arc, gas, and TIG/MIG welding." },
    { code: "578", name: "Turner", duration: 2, description: "Specializes in operating lathes to produce precision metal components and parts." },
    { code: "493", name: "Machinist", duration: 2, description: "Training in operating various machine tools like milling, grinding, and drilling machines for metal fabrication." },
    { code: "592", name: "Wireman", duration: 1, description: "Focuses on internal wiring of buildings, industrial installations, and maintenance of electrical circuits." },
    { code: "502", name: "Mechanic Motor Vehicle", duration: 2, description: "Covers repair, maintenance, and overhauling of engines and mechanical systems of motor vehicles." },
    { code: "477", name: "Instrument Mechanic", duration: 2, description: "Involves installation, calibration, and repair of precision instruments used in industrial processes." },
    { code: "543", name: "Plumber", duration: 1, description: "Focuses on installation and repair of pipes, fixtures, and maintenance of water supply and drainage systems." },
    { code: "416", name: "Civil Engineer Assistant", duration: 2, description: "Assists in planning, surveying, and supervising construction projects like buildings, roads, and bridges." },
    { code: "990", name: "Architectural Draughtsman", duration: 1, description: "Specializes in creating technical drawings and blueprints for architectural designs and construction." },
    { code: "AA_TEMP", name: "Architectural Assistant", duration: 1, description: "Provides support in architectural design, planning, and documentation for building projects." },
    { code: "1035", name: "CAD Technician", duration: 1, description: "Focuses on using Computer-Aided Design software to create precise technical drawings and models." },
    { code: "1001", name: "CNC Operator", duration: 1, description: "Training in operating Computer Numerical Control machines for high-precision manufacturing of metal parts." },
    { code: "418", name: "Computer Hardware and Network Maintenance", duration: 1, description: "Focuses on troubleshooting hardware issues and maintaining local area networks and computer systems." },
    { code: "475", name: "Information Technology", duration: 2, description: "Training in software development, web design, networking, and overall IT infrastructure management." },
    { code: "509", name: "Auto Electrician", duration: 1, description: "Specializes in repair and maintenance of electrical and electronic systems in automobiles." },
    { code: "AUTO_TECH", name: "Automobile Technician", duration: 1, description: "Covers comprehensive servicing, diagnostics, and repair of modern automotive mechanical systems." },
    { code: "Carpenter", name: "Carpenter", duration: 1, description: "Skills in woodworking, furniture making, and construction of wooden structures for buildings." },
    { code: "499", name: "Mason (Building Constructor)", duration: 1, description: "Training in brickwork, stone masonry, and construction of various concrete and building structures." },
    { code: "547", name: "Pump Operator Mechanic", duration: 1, description: "Involves operation, maintenance, and repair of various types of pumps used in irrigation and industry." },
    { code: "497", name: "Marine Fitter", duration: 1, description: "Specializes in fitting and maintaining mechanical equipment and machinery used in ships and marine vessels." },
    { code: "460", name: "Foundryman Technician", duration: 1, description: "Focuses on metal casting processes, pattern making, and operation of furnaces in foundries." },
    { code: "406", name: "Attendant Operator (Chemical Plant)", duration: 1, description: "Covers operation and monitoring of various processing units and equipment in chemical industries." },
    { code: "CABLE_TEMP", name: "Cable Jointer", duration: 1, description: "Specializes in laying, jointing, and terminating high and low voltage underground electrical cables." },
    { code: "ARM_TEMP", name: "Armature Winder", duration: 1, description: "Training in rewinding and repairing electric motors, generators, and transformer coils." },
    { code: "995", name: "Biomedical Instrumentation Technician", duration: 1, description: "Involves maintenance and calibration of medical equipment and diagnostic instruments in healthcare." },
    { code: "409", name: "Basic Cosmetology", duration: 1, description: "Training in skin care, hair styling, and professional beauty treatments for personal grooming." },
    { code: "554", name: "Cutting and Sewing", duration: 1, description: "Focuses on garment construction, tailoring techniques, and industrial sewing machine operation." },
    { code: "433", name: "Digital Photographer", duration: 1, description: "Skills in digital camera operation, photo editing, and professional studio lighting for photography." },
    { code: "415", name: "Catering and Restaurant Management", duration: 1, description: "Covers food preparation, hospitality services, and management of restaurant and catering operations." },
    { code: "402", name: "Agro Processing", duration: 1, description: "Training in processing and preservation of agricultural products and food management techniques." },
    { code: "RICE_TEMP", name: "Rice Mill Operator", duration: 1, description: "Focuses on operation and maintenance of machinery used in rice processing and milling stages." },
    { code: "BOILER_TEMP", name: "Boiler Attendant", duration: 1, description: "Covers operation, monitoring, and maintenance of high-pressure steam boilers in industrial units." },
    { code: "485", name: "Chemical Technician", duration: 1, description: "Assists in chemical analysis, laboratory testing, and quality control processes in industries." }
];

async function populateTrades() {
    console.log(`Starting population check for ${tradesData.length} trades with official codes...`);
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const trade of tradesData) {
        try {
            // Check for duplicate name or code
            const existingName = await databases.listDocuments(
                databaseId,
                collectionId,
                [Query.equal("tradeName", trade.name.trim())]
            );
            
            const existingCode = await databases.listDocuments(
                databaseId,
                collectionId,
                [Query.equal("tradeCode", trade.code)]
            );

            if (existingName.total > 0 || existingCode.total > 0) {
                console.log(`- Skipping: "${trade.name}" / ${trade.code} (Already exists)`);
                skippedCount++;
                continue;
            }

            // Create document
            await databases.createDocument(
                databaseId,
                collectionId,
                ID.unique(),
                {
                    tradeName: trade.name.trim(),
                    tradeCode: trade.code,
                    duration: trade.duration,
                    description: trade.description,
                    isActive: true
                }
            );

            console.log(`+ Success: "${trade.name}" (${trade.code}) added.`);
            createdCount++;

        } catch (error) {
            console.error(`! Error: Failed to add "${trade.name}":`, error.message);
            errorCount++;
        }
    }

    console.log('\n--- POPULATION SUMMARY ---');
    console.log(`Total Trades Processed: ${tradesData.length}`);
    console.log(`Successfully Created: ${createdCount}`);
    console.log(`Skipped (Duplicates): ${skippedCount}`);
    console.log(`Failed (Errors): ${errorCount}`);
    console.log('--------------------------');
}

populateTrades();
