import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey((process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || ""));

const databases = new Databases(client);

async function checkMissing() {
    let allModules = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const response = await databases.listDocuments(
            'itimocktest', 
            'newmodulesdata',
            [
                Query.equal('tradeId', '69cbe4ec1adc9d43e4e3'),
                Query.equal('subjectId', '69cbec4e0009538fadd1'),
                Query.equal('year', 'FIRST'),
                Query.limit(100),
                Query.offset(offset)
            ]
        );

        allModules = allModules.concat(response.documents);
        
        if (response.documents.length < 100) {
            hasMore = false;
        } else {
            offset += 100;
        }
    }

    console.log(`Found ${allModules.length} modules total.`);
    if (allModules.length === 0) {
        console.log("No modules found.");
        return;
    }

    const ids = allModules.map(m => m.moduleId);
    const prefixMatch = ids[0].match(/^[A-Za-z]+/);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    
    let numbers = ids.map(id => {
        let num = id.replace(prefix, '');
        return parseInt(num, 10);
    }).filter(n => !isNaN(n)).sort((a,b) => a - b);

    if (numbers.length === 0) {
        console.log("Could not parse numbers from moduleIds");
        return;
    }

    const max = numbers[numbers.length - 1];
    const missing = [];
    
    let expected = 1;
    for (let i = 0; i < numbers.length; i++) {
        while (expected < numbers[i]) {
            missing.push(`${prefix}${expected}`);
            expected++;
        }
        expected = numbers[i] + 1;
    }

    console.log(`Max moduleId is: ${prefix}${max}`);
    
    if (missing.length > 0) {
        console.log(`Missing modules in the sequence:`);
        console.log(missing.join(', '));
    } else {
        console.log("No modules are missing in the sequence!");
    }
}

checkMissing().catch(console.error);
