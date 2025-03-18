import { Client, Users } from 'node-appwrite';
import ImageKit from 'imagekit';
import { config } from 'dotenv';

config();

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: process.env.IMAGEKIT_URLENDPOINT,
});

export default async ({ req, res, log, error }) => {
  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    // Ensure API key is provided
    if (!req.headers['x-appwrite-key']) {
      throw new Error('Appwrite API key is missing');
    }

    const { action, fileId } = req.bodyJson;
    log(`Action received: ${action}`);

    switch (action) {
      case 'auth':
        // Generate ImageKit authentication parameters
        const authParams = imagekit.getAuthenticationParameters();
        return res.json({ success: true, ...authParams });

      case 'delete':
        if (!fileId) {
          throw new Error('File ID is required for deletion');
        }

        // Delete image from ImageKit
        await imagekit.deleteFile(fileId);
        log(`Image deleted: ${fileId}`);

        return res.json({ success: true, message: 'Image deleted successfully' });

      default:
        throw new Error('Invalid action');
    }
  } catch (err) {
    log('Error:', err.message);
    return res.json({ success: false, error: err.message });
  }
};
