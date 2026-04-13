import { Client, Users, ID, Query, Databases } from 'node-appwrite';

// Validation functions
const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  // Appwrite IDs typically follow a specific format (20 alphanumeric characters)
  if (!/^[0-9a-zA-Z]{20}$/.test(userId)) {
    throw new Error(
      'Invalid userId format: must be 20 characters long and alphanumeric'
    );
  }
};

const validateLabels = (labels) => {
  if (!Array.isArray(labels)) {
    throw new Error('Labels must be an array');
  }

  // Check if all elements are strings and non-empty
  const invalidLabels = labels.filter(
    (label) => typeof label !== 'string' || !label.trim()
  );
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

import migrateAttendance from './migrateAttendance.js';

export default async ({ req, res, log, error }) => {
  const debugLogs = [];
  const trace = (msg) => {
    if (log) log(msg); // Original Appwrite log
    debugLogs.push(msg);
  };

  const updateBatchStatsHelper = async (
    databases,
    userId,
    batchId,
    status,
    date
  ) => {
    const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
    const STATS_COLLECTION_ID = 'userBatchStats';
    const monthKey = date.substring(0, 7); // YYYY-MM

    // Fetch existing stats
    const existingDocs = await databases.listDocuments(
      DB_ID,
      STATS_COLLECTION_ID,
      [Query.equal('userId', userId), Query.equal('batchId', batchId)]
    );

    let isPresent = status === 'present' ? 1 : 0;

    if (existingDocs.total > 0) {
      const existing = existingDocs.documents[0];

      let monthlyData = {};
      try {
        monthlyData = JSON.parse(existing.monthlyAttendance || '{}');
      } catch (e) {}

      if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
      monthlyData[monthKey] += isPresent;

      await databases.updateDocument(DB_ID, STATS_COLLECTION_ID, existing.$id, {
        presentDays: existing.presentDays + isPresent,
        monthlyAttendance: JSON.stringify(monthlyData),
      });
    } else {
      let monthlyData = {};
      monthlyData[monthKey] = isPresent;

      await databases.createDocument(DB_ID, STATS_COLLECTION_ID, ID.unique(), {
        userId,
        batchId,
        totalWorkingDays: 0,
        presentDays: isPresent,
        monthlyAttendance: JSON.stringify(monthlyData),
        testsSubmitted: 0,
        cumulativeScore: 0,
        latestScore: 0,
      });
    }
  };

  const bulkUpdateBatchStats = async (
    databases,
    batchId,
    date,
    statsDataList
  ) => {
    if (!statsDataList || statsDataList.length === 0) return;

    const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
    const STATS_COLLECTION_ID = 'userBatchStats';
    const monthKey = date.substring(0, 7); // YYYY-MM

    // Fetch all existing stats for this batch
    const existingDocs = await databases.listDocuments(
      DB_ID,
      STATS_COLLECTION_ID,
      [Query.equal('batchId', batchId), Query.limit(500)]
    );

    const existingStatsMap = new Map(
      existingDocs.documents.map((doc) => [doc.userId, doc])
    );

    const statsToCreate = [];
    const statsToUpdate = [];

    statsDataList.forEach((record) => {
      let isPresent = record.status === 'present' ? 1 : 0;
      const existing = existingStatsMap.get(record.userId);

      if (existing) {
        let monthlyData = {};
        try {
          monthlyData = JSON.parse(existing.monthlyAttendance || '{}');
        } catch (e) {}

        if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
        monthlyData[monthKey] += isPresent;

        statsToUpdate.push({
          $id: existing.$id,
          presentDays: existing.presentDays + isPresent,
          monthlyAttendance: JSON.stringify(monthlyData),
        });
      } else {
        let monthlyData = {};
        monthlyData[monthKey] = isPresent;

        statsToCreate.push({
          $id: ID.unique(),
          userId: record.userId,
          batchId: batchId,
          totalWorkingDays: 0,
          presentDays: isPresent,
          monthlyAttendance: JSON.stringify(monthlyData),
          testsSubmitted: 0,
          cumulativeScore: 0,
          latestScore: 0,
        });
      }
    });

    if (statsToCreate.length > 0) {
      await databases.createDocuments(
        DB_ID,
        STATS_COLLECTION_ID,
        statsToCreate
      );
    }
    if (statsToUpdate.length > 0) {
      await databases.updateDocuments(
        DB_ID,
        STATS_COLLECTION_ID,
        statsToUpdate
      );
    }
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
    let response;

    switch (action) {
      case 'createAccount': {
        // Expecting userId, email, password, name, countryCode, phone and labels
        const { userId, email, password, name, countryCode, phone, labels } =
          req.bodyJson;

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

        // Create an account using the provided or a unique ID.
        // Convert empty strings to undefined to avoid strict Appwrite validation errors.
        const newUserResponse = await users.create(
          userId || ID.unique(),
          email,
          formattedPhone || undefined,
          password,
          name || undefined
        );

        // Update labels for the created account
        response = await users.updateLabels(newUserResponse.$id, labels);
        log(
          `Account created for user ${newUserResponse.$id} with phone: ${formattedPhone}`
        );
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
        const existingLabels = Array.isArray(userData.labels)
          ? userData.labels
          : [];

        // Merge new labels with the existing ones while ensuring uniqueness
        const mergedLabels = Array.from(
          new Set([...existingLabels, ...newLabels])
        );
        response = await users.updateLabels(userId, mergedLabels);
        log(`Labels added for user ${userId}`);
        break;
      }
      case 'migrateAttendance': {
        const database = new Databases(client);
        response = await migrateAttendance(database, log, error);
        break;
      }
      case 'getUserIdByEmail': {
        // Now also accepts a name despite the property name 'email'
        const emailOrName = req.bodyJson.searchString || req.bodyJson.email;
        trace(`[getUserIdByEmail] Searching for user: ${emailOrName}`);

        if (!emailOrName || typeof emailOrName !== 'string') {
          throw new Error('Invalid search string');
        }

        // Search using robust startsWith matching to bypass tokenization limitations
        trace(
          `[getUserIdByEmail] Executing strict structured Appwrite auth list queries...`
        );
        const [emailList, nameList] = await Promise.all([
          users
            .list([Query.startsWith('email', emailOrName), Query.limit(1)])
            .catch(() => ({ total: 0, users: [] })),
          users
            .list([Query.startsWith('name', emailOrName), Query.limit(1)])
            .catch(() => ({ total: 0, users: [] })),
        ]);

        let user = null;
        if (emailList.total > 0) {
          user = emailList.users[0];
        } else if (nameList.total > 0) {
          user = nameList.users[0];
        }

        if (user) {
          trace(`[getUserIdByEmail] User found: ${user.$id} ${user.email}`);
          response = {
            $id: user.$id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          };
        } else {
          trace(`[getUserIdByEmail] Error: No user found`);
          throw new Error('No user found with the given search text');
        }
        break;
      }
      case 'searchUsers': {
        const { searchTerm } = req.bodyJson;
        trace(`[searchUsers] Triggered with search term: ${searchTerm}`);

        if (!searchTerm || typeof searchTerm !== 'string') {
          throw new Error('Invalid searchTerm: must be a non-empty string');
        }

        // Instead of the native search parameter which tokenizes poorly for emails, use strict startsWith
        trace(`[searchUsers] Running structured queries for name and email...`);
        const [emailList, nameList] = await Promise.all([
          users
            .list([Query.startsWith('email', searchTerm), Query.limit(10)])
            .catch(() => ({ total: 0, users: [] })),
          users
            .list([Query.startsWith('name', searchTerm), Query.limit(10)])
            .catch(() => ({ total: 0, users: [] })),
        ]);

        trace(
          `[searchUsers] Found ${emailList.total} email matches and ${nameList.total} name matches.`
        );

        // Merge without duplicates based on $id
        const userMap = new Map();
        [...(emailList.users || []), ...(nameList.users || [])].forEach(
          (user) => {
            userMap.set(user.$id, {
              $id: user.$id,
              name: user.name,
              email: user.email,
              phone: user.phone,
            });
          }
        );

        response = Array.from(userMap.values());
        trace(
          `[searchUsers] Returning ${response.length} unified unique results.`
        );

        break;
      }
      case 'updateBatchStatsFromTest': {
        const { userId, batchId, score, quesCount } = req.bodyJson;
        if (
          !userId ||
          !batchId ||
          score === undefined ||
          quesCount === undefined
        ) {
          throw new Error(
            'Missing required fields for updateBatchStatsFromTest'
          );
        }

        const percentageScore = quesCount > 0 ? (score / quesCount) * 100 : 0;
        const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
        const STATS_COLLECTION_ID = 'userBatchStats';

        // Fetch existing stats
        const existingDocs = await databases.listDocuments(
          DB_ID,
          STATS_COLLECTION_ID,
          [Query.equal('userId', userId), Query.equal('batchId', batchId)]
        );

        if (existingDocs.total > 0) {
          const existing = existingDocs.documents[0];
          response = await databases.updateDocument(
            DB_ID,
            STATS_COLLECTION_ID,
            existing.$id,
            {
              testsSubmitted: existing.testsSubmitted + 1,
              cumulativeScore: existing.cumulativeScore + percentageScore,
              latestScore: percentageScore,
            }
          );
          log(`Updated test stats for user ${userId} in batch ${batchId}`);
        } else {
          response = await databases.createDocument(
            DB_ID,
            STATS_COLLECTION_ID,
            ID.unique(),
            {
              userId,
              batchId,
              testsSubmitted: 1,
              cumulativeScore: percentageScore,
              latestScore: percentageScore,
              totalWorkingDays: 0,
              presentDays: 0,
              monthlyAttendance: '{}',
            }
          );
          log(`Created test stats for user ${userId} in batch ${batchId}`);
        }
        break;
      }
      case 'updateBatchStatsFromAttendance': {
        const { userId, batchId, status, date } = req.bodyJson;
        if (!userId || !batchId || !status || !date) {
          throw new Error(
            'Missing required fields for updateBatchStatsFromAttendance'
          );
        }
        await updateBatchStatsHelper(databases, userId, batchId, status, date);
        response = { updatedId: userId };
        log(`Updated attendance stats for user ${userId} in batch ${batchId}`);
        break;
      }
      case 'bulkUpdateBatchStatsFromAttendance': {
        const { batchId, date, statsDataList } = req.bodyJson;
        if (!batchId || !date || !statsDataList) {
          throw new Error(
            'Missing required fields for bulkUpdateBatchStatsFromAttendance'
          );
        }
        await bulkUpdateBatchStats(databases, batchId, date, statsDataList);
        response = { success: true };
        log(`Bulk updated attendance stats for batch ${batchId}`);
        break;
      }
      case 'markBatchAttendance': {
        const { batchId, date, attendanceData } = req.bodyJson;
        if (!batchId || !date || !attendanceData) {
          throw new Error('Missing required fields for markBatchAttendance');
        }

        const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
        const NEW_ATTENDANCE_COL_ID = 'newAttendance';

        // 1. Fetch existing attendance docs for that batch and date
        const existingDocsRes = await databases.listDocuments(
          DB_ID,
          NEW_ATTENDANCE_COL_ID,
          [
            Query.equal('batchId', batchId),
            Query.equal('date', date),
            Query.limit(500),
          ]
        );

        const existingRecordsMap = new Map(
          existingDocsRes.documents.map((doc) => [doc.userId, doc])
        );

        const newRecords = [];
        const existingToUpdate = [];
        const statsToUpdate = [];

        attendanceData.forEach((record) => {
          const existing = existingRecordsMap.get(record.userId);
          if (existing) {
            const needsUpdate =
              existing.status !== record.status ||
              existing.remarks !== record.remarks;
            if (needsUpdate) {
              existingToUpdate.push({
                $id: existing.$id,
                status: record.status,
                remarks: record.remarks || null,
              });
              statsToUpdate.push(record);
            }
          } else {
            newRecords.push({
              $id: ID.unique(),
              userId: record.userId,
              batchId: batchId,
              tradeId: record.tradeId || null,
              date: date,
              status: record.status,
              remarks: record.remarks || null,
              markedAt: new Date().toISOString(),
            });
            statsToUpdate.push(record);
          }
        });

        const results = {
          created: 0,
          updated: 0,
          newDocs: [],
          updatedDocs: [],
          errors: [],
          success: [],
        };

        if (newRecords.length > 0) {
          const createdRes = await databases.createDocuments(
            DB_ID,
            NEW_ATTENDANCE_COL_ID,
            newRecords
          );
          // Assuming createdRes is an array or has a documents array
          const createdDocs = Array.isArray(createdRes)
            ? createdRes
            : createdRes.documents || newRecords;
          results.created = createdDocs.length;
          results.newDocs = createdDocs;
          results.success.push(...createdDocs);
        }

        if (existingToUpdate.length > 0) {
          const updatedRes = await databases.updateDocuments(
            DB_ID,
            NEW_ATTENDANCE_COL_ID,
            existingToUpdate
          );
          const updatedDocs = Array.isArray(updatedRes)
            ? updatedRes
            : updatedRes.documents || existingToUpdate;
          results.updated = updatedDocs.length;
          results.updatedDocs = updatedDocs;
          results.success.push(...updatedDocs);
        }

        // Update stats
        try {
          await bulkUpdateBatchStats(databases, batchId, date, statsToUpdate);
        } catch (err) {
          log(`Failed bulk stats update: ${err.message}`);
        }

        response = {
          success: results.success,
          errors: [],
          total: attendanceData.length,
          created: results.created,
          updated: results.updated,
          unchanged: attendanceData.length - results.created - results.updated,
          failed: 0,
        };
        break;
      }
      case 'createMultipleAttendance': {
        const { attendanceRecords } = req.bodyJson;
        const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
        const NEW_ATTENDANCE_COL_ID = 'newAttendance';

        const recordsToInsert = attendanceRecords.map((r) => ({
          $id: ID.unique(),
          userId: r.userId,
          batchId: r.batchId,
          tradeId: r.tradeId || null,
          date: r.date,
          status: r.status,
          remarks: r.remarks || null,
          markedAt: new Date().toISOString(),
        }));

        const createdRes = await databases.createDocuments(
          DB_ID,
          NEW_ATTENDANCE_COL_ID,
          recordsToInsert
        );
        const createdDocs = Array.isArray(createdRes)
          ? createdRes
          : createdRes.documents || recordsToInsert;

        // update stats in bulk
        if (recordsToInsert.length > 0) {
          try {
            await bulkUpdateBatchStats(
              databases,
              recordsToInsert[0].batchId,
              recordsToInsert[0].date,
              recordsToInsert
            );
          } catch (err) {
            log(`Failed bulk stats update: ${err.message}`);
          }
        }

        response = {
          success: createdDocs,
          errors: [],
          total: attendanceRecords.length,
          created: createdDocs.length,
          failed: 0,
        };
        break;
      }
      case 'deleteMultipleAttendance': {
        const { documentIds } = req.bodyJson;
        if (!documentIds || !Array.isArray(documentIds)) {
          throw new Error('Missing documentIds for deleteMultipleAttendance');
        }

        const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
        const NEW_ATTENDANCE_COL_ID = 'newAttendance';

        await databases.deleteDocuments(
          DB_ID,
          NEW_ATTENDANCE_COL_ID,
          documentIds
        );
        response = { deletedIds: documentIds };
        break;
      }
      default: {
        throw new Error('Invalid action specified');
      }
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
