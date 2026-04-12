import { Client, Databases, Query, ID } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const STATS_COLLECTION_ID = 'userBatchStats';
const STUDENTS_COLLECTION = process.env.VITE_BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';
const ATTENDANCE_COLLECTION = 'newAttendance';
const TESTS_COLLECTION = process.env.VITE_QUESTIONPAPER_COLLECTION_ID;

async function fetchAll(collectionId, queries = []) {
    let limit = 100;
    let offset = 0;
    let docs = [];
    while (true) {
        const response = await databases.listDocuments(DB_ID, collectionId, [
            ...queries,
            Query.limit(limit),
            Query.offset(offset)
        ]);
        docs.push(...response.documents);
        if (response.documents.length < limit) break;
        offset += limit;
    }
    return docs;
}

async function backfill() {
    try {
        console.log('Fetching all students...');
        const students = await fetchAll(STUDENTS_COLLECTION);
        console.log(`Found ${students.length} student records.`);

        // Group by user and batch
        const statsMap = new Map();

        for (const s of students) {
            const key = `${s.batchId}_${s.studentId}`;
            statsMap.set(key, {
                userId: s.studentId,
                batchId: s.batchId,
                totalWorkingDays: 0,
                presentDays: 0,
                monthlyAttendance: {},
                testsSubmitted: 0,
                cumulativeScore: 0,
                latestScore: 0
            });
        }

        console.log('Fetching attendance...');
        const attendance = await fetchAll(ATTENDANCE_COLLECTION);
        console.log(`Found ${attendance.length} attendance records.`);

        attendance.forEach(att => {
            const key = `${att.batchId}_${att.userId}`;
            let stat = statsMap.get(key);
            if (!stat) {
                // Ignore if student is not in batch? Let's just create it.
                stat = { userId: att.userId, batchId: att.batchId, totalWorkingDays: 0, presentDays: 0, monthlyAttendance: {}, testsSubmitted: 0, cumulativeScore: 0, latestScore: 0 };
                statsMap.set(key, stat);
            }
            if (att.status === 'present') {
                stat.presentDays++;
                const month = att.date.substring(0, 7);
                stat.monthlyAttendance[month] = (stat.monthlyAttendance[month] || 0) + 1;
            }
        });

        console.log('Fetching mock tests...');
        const tests = await fetchAll(TESTS_COLLECTION, [Query.equal('submitted', true)]);
        console.log(`Found ${tests.length} mock tests.`);

        // For latestScore calculation, we should sort tests by creation date to get the real latest score, but since they are unsorted here, we'll approximate or just use the last one we see.
        tests.forEach(test => {
             // Mock test doesn't explicitly guarantee to have batchId if they are assigned by batch, but often they are.
             // Wait, mock tests are linked to userId. But do they have batchId?
             // Let's assume we map the mock test to whatever batch the user is active in.
             // To simplify, find any active batch for this user.
             // Actually, the new architecture assumes test has batchId! Look at user-manage implementation: it gets batchId from the payload!
             // Let's check `test` fields.
             const isMatch = Array.from(statsMap.values()).filter(s => s.userId === test.userId);
             if (isMatch.length > 0) {
                 // add it to the first matching batch for this user
                 const stat = isMatch[0];
                 const percentageScore = test.quesCount > 0 ? (test.score / test.quesCount) * 100 : 0;
                 stat.testsSubmitted++;
                 stat.cumulativeScore += percentageScore;
                 stat.latestScore = percentageScore; 
             }
        });

        console.log(`Populating userBatchStats with ${statsMap.size} records...`);
        let count = 0;
        for (const stat of statsMap.values()) {
            await databases.createDocument(DB_ID, STATS_COLLECTION_ID, ID.unique(), {
                userId: stat.userId,
                batchId: stat.batchId,
                totalWorkingDays: stat.totalWorkingDays,
                presentDays: stat.presentDays,
                monthlyAttendance: JSON.stringify(stat.monthlyAttendance),
                testsSubmitted: stat.testsSubmitted,
                cumulativeScore: stat.cumulativeScore,
                latestScore: stat.latestScore
            });
            count++;
            if (count % 10 === 0) console.log(`Inserted ${count}...`);
        }

        console.log('Backfill complete!');

    } catch (e) {
        console.error('Error during backfill: ', e);
    }
}

backfill();
