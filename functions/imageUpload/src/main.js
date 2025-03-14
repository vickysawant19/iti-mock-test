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

    // Generate ImageKit authentication parameters
    const authParams = imagekit.getAuthenticationParameters();

    // Return authentication parameters for client-side uploads
    return res.json({
      success: true,
      ...authParams,
    });
  } catch (err) {
    log('Error generating ImageKit auth parameters:', err.message);
    return res.json({
      success: false,
      error: err.message,
    });
  }
};
