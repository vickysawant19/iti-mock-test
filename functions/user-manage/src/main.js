import { Client, Users, ID, Query } from 'node-appwrite';

// Validation functions
const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  // Appwrite IDs typically follow a specific format (20 alphanumeric characters)
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

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email: must be a non-empty string');
  }
  // Basic email pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid password: must be a non-empty string');
  }
};

export default async ({ req, res, log, error }) => {
  try {
    if (!req.bodyJson) {
      throw new Error('Request body is required');
    }

    const { action } = req.bodyJson;
    if (!action) {
      throw new Error('Action is required');
    }
    
    // Validate Appwrite API key header and environment variables
    validateAppwriteKey(req.headers['x-appwrite-key']);
    if (!process.env.APPWRITE_FUNCTION_API_ENDPOINT || !process.env.APPWRITE_FUNCTION_PROJECT_ID) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key']);

    const users = new Users(client);
    let response;

    switch (action) {
      case 'createAccount': {
        // Expecting userId, email, password, name, phone and labels
        const { userId, email, password, name, phone, labels } = req.bodyJson;
        // Validate required fields
        validateEmail(email);
        validatePassword(password);
        validateLabels(labels);
        
        // Create an account using the provided or a unique ID
        const newUserResponse = await users.create(userId || ID.unique(), email, phone, password, name);
        // Update labels for the created account
        response = await users.updateLabels(newUserResponse.$id, labels);
        log(`Account created for user ${newUserResponse.$id}`);
        break;
      }
      case 'deleteAccount': {
        // Expecting userId in the request
        const { userId } = req.bodyJson;
        validateUserId(userId);
        // Delete the user account
        response = await users.delete(userId);
        log(`Account deleted for user ${userId}`);
        break;
      }
      case 'updateLabels': {
        // Expecting userId and labels array
        const { userId, labels } = req.bodyJson;
        validateUserId(userId);
        validateLabels(labels);
        response = await users.updateLabels(userId, labels);
        log(`Labels updated for user ${userId}`);
        break;
      }
      case 'addLabels': {
        // Expecting userId and labels to add
        const { userId, labels: newLabels } = req.bodyJson;
        validateUserId(userId);
        validateLabels(newLabels);
        
        // Retrieve the current user data to get existing labels
        const userData = await users.get(userId);
        // Assume that userData.labels is an array of strings; if not present, use an empty array
        const existingLabels = Array.isArray(userData.labels) ? userData.labels : [];
        
        // Merge new labels with the existing ones while ensuring uniqueness
        const mergedLabels = Array.from(new Set([...existingLabels, ...newLabels]));
        response = await users.updateLabels(userId, mergedLabels);
        log(`Labels added for user ${userId}`);
        break;
      }
      case 'getUserIdByEmail': {
        // Expecting an email in the request
        const { email } = req.bodyJson;
        validateEmail(email);
        
        // Use a query to search for users by email.
        // The query syntax here assumes Appwrite's standard search syntax.
        // For example: 'email='+email
       
        const userList = await users.list([Query.equal("email", email)]);
        // Check if any user is found
        if (userList.total && userList.total > 0 && Array.isArray(userList.users)) {
          // Return the first matching user's id
          response = userList;
          // response = { userId: userList.users[0].$id };
          log(`UserId fetched for email ${email}`);
        } else {
          throw new Error('No user found with the given email');
        }
        break;
      }
      default: {
        throw new Error('Invalid action specified');
      }
    }

    return res.json({
      success: true,
      data: response
    });
    
  } catch (err) {
    error(`Error performing action: ${err.message}`);
    return res.json({
      success: false,
      error: err.message
    }, 400);
  }
};
