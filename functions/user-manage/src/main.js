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

const validateCountryCode = (countryCode) => {
  if (!countryCode || typeof countryCode !== 'string') {
    throw new Error('Invalid country code: must be a non-empty string');
  }
  // Remove any leading + if present and validate format (1-3 digits)
  const cleanCode = countryCode.replace(/^\+/, '');
  if (!/^[1-9]\d{0,2}$/.test(cleanCode)) {
    throw new Error('Invalid country code format: must be 1-3 digits');
  }
};

const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Invalid phone: must be a non-empty string');
  }
  // Basic phone validation (digits only, 7-15 characters)
  if (!/^\d{7,15}$/.test(phone)) {
    throw new Error('Invalid phone format: must be 7-15 digits');
  }
};

const formatPhoneNumber = (countryCode, phone) => {
  if (!countryCode || !phone) {
    return '';
  }
  
  // Clean country code (remove + if present)
  const cleanCountryCode = countryCode.replace(/^\+/, '');
  // Clean phone number (remove any non-digits)
  const cleanPhone = phone.replace(/\D/g, '');
  
  return `+${cleanCountryCode}${cleanPhone}`;
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
        // Expecting userId, email, password, name, countryCode, phone and labels
        const { userId, email, password, name, countryCode, phone, labels } = req.bodyJson;
        
        // Validate required fields
        validateEmail(email);
        validatePassword(password);
        validateLabels(labels);
        
        // Format phone number with country code if both are provided
        let formattedPhone = '';
        if (countryCode && phone) {
          validateCountryCode(countryCode);
          validatePhone(phone);
          formattedPhone = formatPhoneNumber(countryCode, phone);
        } else if (phone) {
          // If only phone is provided without country code, use it as is (assuming it includes country code)
          formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
        }
        
        // Create an account using the provided or a unique ID
        const newUserResponse = await users.create(
          userId || ID.unique(), 
          email, 
          formattedPhone, 
          password, 
          name
        );
        
        // Update labels for the created account
        response = await users.updateLabels(newUserResponse.$id, labels);
        log(`Account created for user ${newUserResponse.$id} with phone: ${formattedPhone}`);
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
          const user = userList.users[0];
          response = { $id: user.$id, name: user.name, email: user.email, phone: user.phone };
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