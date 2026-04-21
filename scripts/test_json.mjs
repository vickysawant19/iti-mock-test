import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases = new Databases(client);

async function check() {
    let offset = 0;
    while (true) {
        const res = await databases.listDocuments('itimocktest', 'newmodulesdata', [
            Query.limit(100),
            Query.offset(offset)
        ]);
        if (res.documents.length === 0) break;
        
        for (const doc of res.documents) {
            if (doc.evalutionsPoints && doc.evalutionsPoints.length > 0) {
                for (let i = 0; i < doc.evalutionsPoints.length; i++) {
                    try {
                        JSON.parse(doc.evalutionsPoints[i]);
                    } catch (e) {
                        console.log(`Failed inside document ${doc.moduleId} (${doc.$id})`);
                        console.log(`Raw string length: ${doc.evalutionsPoints[i].length}`);
                        console.log(`Raw string: >>>${doc.evalutionsPoints[i]}<<<\n`);
                        // Optionally auto-fix it if it's missing quotes
                    }
                }
            }
        }
        offset += 100;
    }
    console.log("Check complete.");
}
check();
