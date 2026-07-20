import { ID, Query } from 'node-appwrite';
import {
  validateUserId,
  validateLabels,
  validateEmail,
  validatePassword,
  validateCountryCode,
  validatePhone,
  formatPhoneNumber
} from './utils.js';

export const handleUserAction = async (action, req, res, users, log, trace) => {
  const { userId, email, password, name, countryCode, phone, labels, searchString, searchTerm } = req.bodyJson;

  switch (action) {
    case 'createAccount': {
      validateEmail(email);
      validatePassword(password);
      validateLabels(labels);

      let formattedPhone = '';
      if (countryCode && phone) {
        validateCountryCode(countryCode);
        validatePhone(phone);
        formattedPhone = formatPhoneNumber(countryCode, phone);
      } else if (phone) {
        formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      }

      const newUserResponse = await users.create(
        userId || ID.unique(),
        email,
        formattedPhone || undefined,
        password,
        name || undefined
      );

      const response = await users.updateLabels(newUserResponse.$id, labels);
      log(`Account created for user ${newUserResponse.$id} with phone: ${formattedPhone}`);
      return response;
    }
    case 'deleteAccount': {
      validateUserId(userId);
      const response = await users.delete(userId);
      log(`Account deleted for user ${userId}`);
      return response;
    }
    case 'updatePassword': {
      validateUserId(userId);
      validatePassword(password);
      const response = await users.updatePassword(userId, password);
      log(`Password updated for user ${userId} by an authorized teacher`);
      return response;
    }
    case 'updateEmail': {
      validateUserId(userId);
      validateEmail(email);
      const response = await users.updateEmail(userId, email);
      log(`Email updated for user ${userId} to ${email} by an authorized teacher`);
      return response;
    }
    case 'updateLabels': {
      validateUserId(userId);
      validateLabels(labels);
      const response = await users.updateLabels(userId, labels);
      log(`Labels updated for user ${userId}`);
      return response;
    }
    case 'addLabels': {
      validateUserId(userId);
      validateLabels(labels);

      const userData = await users.get(userId);
      const existingLabels = Array.isArray(userData.labels) ? userData.labels : [];
      const mergedLabels = Array.from(new Set([...existingLabels, ...labels]));
      const response = await users.updateLabels(userId, mergedLabels);
      log(`Labels added for user ${userId}`);
      return response;
    }
    case 'getUserIdByEmail': {
      const emailOrName = searchString || email;
      trace(`[getUserIdByEmail] Searching for user: ${emailOrName}`);

      if (!emailOrName || typeof emailOrName !== 'string') {
        throw new Error('Invalid search string');
      }

      trace(`[getUserIdByEmail] Executing strict structured Appwrite auth list queries...`);
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
        return {
          $id: user.$id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        };
      } else {
        trace(`[getUserIdByEmail] Error: No user found`);
        throw new Error('No user found with the given search text');
      }
    }
    case 'searchUsers': {
      trace(`[searchUsers] Triggered with search term: ${searchTerm}`);

      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new Error('Invalid searchTerm: must be a non-empty string');
      }

      trace(`[searchUsers] Running structured queries for name and email...`);
      const [emailList, nameList] = await Promise.all([
        users
          .list([Query.startsWith('email', searchTerm), Query.limit(10)])
          .catch(() => ({ total: 0, users: [] })),
        users
          .list([Query.startsWith('name', searchTerm), Query.limit(10)])
          .catch(() => ({ total: 0, users: [] })),
      ]);

      trace(`[searchUsers] Found ${emailList.total} email matches and ${nameList.total} name matches.`);

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

      const response = Array.from(userMap.values());
      trace(`[searchUsers] Returning ${response.length} unified unique results.`);
      return response;
    }
    default:
      return null;
  }
};
