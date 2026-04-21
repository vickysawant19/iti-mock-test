import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases = new Databases(client);
const DB_ID = 'itimocktest';
const COL_ID = 'newAttendance';
const TEACHER_ID = '667913410027f95c3a71';

async function fetchAbsentDays() {
    console.log(`\n🔍 Fetching absent days for teacher: ${TEACHER_ID}`);
    
    try {
        const response = await databases.listDocuments(
            DB_ID,
            COL_ID,
            [
                Query.equal('userId', TEACHER_ID),
                Query.equal('status', 'absent'),
                Query.orderAsc('date'),
                Query.limit(100)
            ]
        );

        if (response.documents.length === 0) {
            console.log('✅ No absent days found for this teacher.');
        } else {
            console.log(`\n❌ Found ${response.documents.length} absent day(s):`);
            console.log('─'.repeat(40));
            response.documents.forEach((doc, index) => {
                const date = new Date(doc.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
                const remarks = doc.remarks || 'No remarks';
                console.log(`${index + 1}. 📅 ${date} | 📝 ${remarks}`);
            });
            console.log('─'.repeat(40));
        }
    } catch (error) {
        console.error('❌ Error fetching data:', error.message);
    }
}

fetchAbsentDays();
