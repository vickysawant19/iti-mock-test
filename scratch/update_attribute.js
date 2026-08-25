import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://api.itimitra.in/v1')
  .setProject('itimocktest')
  .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

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
