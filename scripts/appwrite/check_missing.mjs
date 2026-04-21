import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

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
