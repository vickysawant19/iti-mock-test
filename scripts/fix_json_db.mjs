import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey((process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || ""));

const databases = new Databases(client);

async function repair() {
    let offset = 0;
    let repairedCount = 0;

    console.log("🛠️ Starting repair of malformed evaluation points...");

    while (true) {
        const res = await databases.listDocuments('itimocktest', 'newmodulesdata', [
            Query.limit(100),
            Query.offset(offset)
        ]);
        if (res.documents.length === 0) break;
        
        for (const doc of res.documents) {
            let malformed = false;
            
            if (doc.evalutionsPoints && doc.evalutionsPoints.length > 0) {
                let newEval = [];
                let currentStr = "";
                let hasError = false;

                for (let i = 0; i < doc.evalutionsPoints.length; i++) {
                    const chunk = doc.evalutionsPoints[i];
                    if (currentStr === "") {
                        currentStr = chunk;
                    } else {
                        currentStr += '","' + chunk; // rejoin exactly how it was mistakenly split
                    }

                    try {
                        JSON.parse(currentStr);
                        newEval.push(currentStr);
                        currentStr = ""; // Reset for next valid object
                    } catch (e) {
                        malformed = true;
                        hasError = true;
                    }
                }

                if (hasError && currentStr === "") {
                    // Fully repaired successfully into newEval array
                    console.log(`✅ Repaired JSON for module ${doc.moduleId}`);
                    await databases.updateDocument('itimocktest', 'newmodulesdata', doc.$id, {
                        evalutionsPoints: newEval
                    });
                    repairedCount++;
                } else if (hasError && currentStr !== "") {
                     console.log(`❌ Failed to repair ${doc.moduleId}, Leftover string: ${currentStr}`);
                }
            }
        }
        offset += 100;
    }
    console.log(`\n🎉 Repair complete! Fixed ${repairedCount} modules.`);
}
repair();
