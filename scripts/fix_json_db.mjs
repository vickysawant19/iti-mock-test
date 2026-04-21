import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

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
