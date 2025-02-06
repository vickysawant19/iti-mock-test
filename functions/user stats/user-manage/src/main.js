import { Client, Users } from 'node-appwrite';

// Validation functions
const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  // Appwrite IDs typically follow a specific format
  if (!/^[0-9a-zA-Z]{20}$/.test(userId)) {
    throw new Error('Invalid userId format: must be 20 characters long and alphanumeric');
  }
};

const validateLabels = (labels) => {
  if (!Array.isArray(labels)) {
    throw new Error('Labels must be an array');
  }
  
  // Check if all elements are strings and non-empty
  const invalidLabels = labels.filter(label => typeof label !== 'string' || !label.trim());
  if (invalidLabels.length > 0) {
    throw new Error('All labels must be non-empty strings');
  }
  
  // Check for duplicate labels
  const uniqueLabels = new Set(labels);
  if (uniqueLabels.size !== labels.length) {
    throw new Error('Duplicate labels are not allowed');
  }
};

const validateAppwriteKey = (key) => {
  if (!key || typeof key !== 'string') {
    throw new Error('Missing or invalid Appwrite API key');
  }
};

export default async ({ req, res, log, error }) => {
  try {
    // Validate request body
    const { userId, labels } = req.bodyJson || {};
    if (!req.bodyJson) {
      throw new Error('Request body is required');
    }

    // Run validations
    validateUserId(userId);
    validateLabels(labels);
    validateAppwriteKey(req.headers['x-appwrite-key']);

    // Validate environment variables
    if (!process.env.APPWRITE_FUNCTION_API_ENDPOINT || !process.env.APPWRITE_FUNCTION_PROJECT_ID) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key']);

    const users = new Users(client);

    // Update user labels
    const response = await users.updateLabels(userId, labels);
    
    // Log successful operation
    log(`Successfully updated labels for user ${userId}`);
    
    return res.json({
      success: true,
      data: response
    });

  } catch (err) {
    // Log the error
    error(`Error updating user labels: ${err.message}`);
    
    // Return appropriate error response
    return res.json({
      success: false,
      error: err.message
    }, 400);
  }
};