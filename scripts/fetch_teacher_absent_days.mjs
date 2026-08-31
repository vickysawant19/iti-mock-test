import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey((process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || ""));

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
