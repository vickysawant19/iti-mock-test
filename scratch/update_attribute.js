import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://auth.itimitra.in/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || 'itimocktest')
  .setKey(process.env.VITE_APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function run() {
  try {
    const collection = await databases.getCollection('itimocktest', 'batch_game_settings');
    console.log('Collection attributes:', collection.attributes);

    const attr = collection.attributes.find(a => a.key === 'selectedModuleName');
    console.log('Current selectedModuleName attribute:', attr);

    if (attr) {
      console.log('Updating selectedModuleName attribute size to 4096...');
      // Appwrite REST endpoint PUT /v1/databases/{databaseId}/collections/{collectionId}/attributes/string/{key}
      const apiPath = `/databases/itimocktest/collections/batch_game_settings/attributes/string/selectedModuleName`;
      const uri = new URL(client.config.endpoint + apiPath);
      const res = await client.call('put', uri, {
        'X-Appwrite-Project': client.config.project,
        'X-Appwrite-Key': client.config.key,
        'content-type': 'application/json',
      }, {
        required: attr.required || false,
        size: 4096,
        default: attr.default || null,
      });
      console.log('Update result:', res);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
