import { Client, Databases, Permission, Role } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'userBatchStats';

async function updatePermissions() {
    try {
        console.log(`Updating permissions for collection ${COLLECTION_ID}...`);
        await databases.updateCollection(
            DB_ID, 
            COLLECTION_ID,
            'userBatchStats', // name
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        );
        console.log('Permissions updated successfully!');
    } catch (err) {
        console.error('Error updating permissions: ', err);
    }
}

updatePermissions();
