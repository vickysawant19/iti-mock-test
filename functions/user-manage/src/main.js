import { Client, Users, Databases, TablesDB } from 'node-appwrite';
import { validateAppwriteKey } from './utils.js';
import { handleUserAction } from './userActions.js';
import { handleAttendanceAction } from './attendanceActions.js';

export default async ({ req, res, log, error }) => {
  const debugLogs = [];
  const trace = (msg) => {
    if (log) log(msg); // Original Appwrite log
    debugLogs.push(msg);
  };

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
    if (
      !process.env.APPWRITE_FUNCTION_API_ENDPOINT ||
      !process.env.APPWRITE_FUNCTION_PROJECT_ID
    ) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key']);

    const users = new Users(client);
    const databases = new Databases(client);
    const tablesDB = new TablesDB(client);
    let response;

    // Check if the action belongs to user management
    response = await handleUserAction(action, req, res, users, log, trace);

    // If not a user action, check if it belongs to attendance/statistics
    if (response === null) {
      response = await handleAttendanceAction(action, req, res, client, databases, tablesDB, log, error);
    }

    if (response === null) {
      throw new Error('Invalid action specified');
    }

    return res.json({
      success: true,
      data: response,
      logs: debugLogs,
    });
  } catch (err) {
    if (error) error(`Error performing action: ${err}`);
    return res.json(
      {
        success: false,
        error: err.message,
        logs: debugLogs,
      },
      400
    );
  }
};
