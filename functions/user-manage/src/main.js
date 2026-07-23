import { Client, Users, Databases, TablesDB, Query } from 'node-appwrite';
import { validateAppwriteKey } from './utils.js';
import { handleUserAction } from './userActions.js';
import { handleAttendanceAction } from './attendanceActions.js';
import { handleBatchAction } from './batchActions.js';

export default async ({ req, res, log, error }) => {
  const debugLogs = [];
  const trace = (msg) => {
    if (log) log(msg); // Original Appwrite log
    debugLogs.push(msg);
  };

  try {
    const event = req.headers['x-appwrite-event'];
    trace(`Triggered by event: ${event}`);

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

    const databases = new Databases(client);

    // ── Handle Presence Deletion Event ──
    if (event && event.startsWith('presences.') && event.endsWith('.delete')) {
      const presence = req.bodyJson;
      if (!presence || !presence.userId) {
        throw new Error('Event body is missing presence details (userId)');
      }

      const userId = presence.userId;
      trace(`User offline event for userId: ${userId}`);

      const databaseId = process.env.DATABASE_ID || 'itimocktest';
      const userProfileCollectionId = process.env.USER_PROFILE_COLLECTION_ID || '66937340001047368f32';

      // Locate profile row
      const profileList = await databases.listDocuments(
        databaseId,
        userProfileCollectionId,
        [Query.equal('userId', userId), Query.limit(1)]
      );

      if (profileList.total === 0) {
        trace(`No profile found for userId: ${userId}. Skipping update.`);
        return res.json({ success: true, message: 'No profile found', logs: debugLogs });
      }

      const profile = profileList.documents[0];
      trace(`Updating lastseen for profile: ${profile.$id}`);

      const updatedProfile = await databases.updateDocument(
        databaseId,
        userProfileCollectionId,
        profile.$id,
        {
          lastseen: new Date().toISOString()
        }
      );

      trace(`Successfully updated lastseen to ${updatedProfile.lastseen}`);
      return res.json({
        success: true,
        data: {
          profileId: profile.$id,
          lastseen: updatedProfile.lastseen,
        },
        logs: debugLogs,
      });
    }

    // ── Existing HTTP Execution Logic ──
    if (!req.bodyJson) {
      throw new Error('Request body is required');
    }

    const { action } = req.bodyJson;
    if (!action) {
      throw new Error('Action is required');
    }

    const users = new Users(client);
    const tablesDB = new TablesDB(client);
    let response;

    // Check if the action belongs to user management
    response = await handleUserAction(action, req, res, users, log, trace);

    // Check if the action belongs to batch management
    if (response === null) {
      response = await handleBatchAction(action, req, res, client, log, trace);
    }

    // If not user or batch action, check if it belongs to attendance/statistics
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
