import { Client, Databases } from 'node-appwrite';
import {
  autoMarkAbsentees,
  cleanupOld,
  markPresent,
  updateAttendance,
} from './actions/index.js';

import { isoDateOnly, getIndianTime } from './utils/index.js';
import config from './config/index.js';

export default async ({ req, res, log, error }) => {
  // CORS preflight (optional)
  if (req.method === 'OPTIONS') {
    return res.send('', 200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Appwrite-Key',
    });
  }

  // Basic request validation (we accept a body for actions)
  const body = req.bodyJson ?? {};
  const { action = 'autoMarkAbsentees', payload = {} } = body;

  // Create Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(
      req.headers['x-appwrite-key'] ??
        process.env.APPWRITE_FUNCTION_API_KEY ??
        ''
    );

  const database = new Databases(client);

  const today = isoDateOnly();

  // --- Actions ---
  let result = { action, timestamp: getIndianTime() };

  try {
    switch (action) {
      case 'autoMarkAbsentees':
        result = await autoMarkAbsentees(payload, {
          database,
          log,
          error,
          today,
        });
        break;
      case 'markPresent':
        result = await markPresent(payload, {
          database,
          config,
          log,
          error,
          today,
        });
        break;
      case 'updateAttendance':
        result = await updateAttendance(payload, {
          database,
          config,
          log,
          error,
        });
        break;
      case 'cleanupOld':
        result = await cleanupOld(payload, { database, config, log, error });
        break;
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    log(result);

    return res.json({ success: true, result });
  } catch (err) {
    error(err.message || err.toString());
    return res.json({ success: false, error: err.message || String(err) }, 500);
  }
};
