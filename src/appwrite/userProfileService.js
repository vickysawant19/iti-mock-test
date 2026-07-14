import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";
import { checkProfileCompletion } from "../utils/profileCompletion";

export class UserProfileService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
    this.profileCache = new Map();
    this.profileRequests = new Map();
  }

  async createUserProfile({
    DOB,
    address,
    email,
    gradeLevel,
    parentContact,
    phone,
    profileImage,
    role,
    experience,
    userId,
    userName,
    specialization = [],
    onboardingStep = 0,
    isProfileComplete = false,
  }) {
    try {
      const userProfile = {
        DOB: DOB || null,
        address: address || null,
        email: email || null,
        gradeLevel: gradeLevel || null,
        parentContact: parseInt(parentContact) || null,
        phone: parseInt(phone) || null,
        profileImage: profileImage || null,
        role: role || null,
        experience: experience || null,
        userId: userId || null,
        userName: userName || null,
        specialization: specialization || [],
        onboardingStep,
        isProfileComplete,
      };

      const response = await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.userProfilesCollectionId,
        rowId: "unique()",
        data: userProfile
      });

      if (response && response.userId) {
        // Clear any stale 'not found' cache entry before storing the real profile
        this.profileCache.delete(response.userId);
        this.profileCache.set(response.userId, response);
      }

      return response;
    } catch (error) {
      console.error("Appwrite error: creating user profile:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  /**
   * Creates a minimal stub profile for a user who exists in Auth but not in userProfile.
   * Useful when a teacher adds/requests a student who hasn't completed onboarding.
   */
  async createStubProfile(userId, name, email) {
    try {
      return await this.createUserProfile({
        userId,
        userName: name || "Unknown User",
        email: email,
        isProfileComplete: false,
        onboardingStep: 0,
        role: ["Student"], // Default role
      });
    } catch (error) {
      console.error("Appwrite error: creating stub profile:", error);
      throw error;
    }
  }

  /**
   * Full-field update — only safe to call when you have ALL fields available
   * (e.g. when saving the entire profile form).
   *
   * ⚠️ IMPORTANT: Any field passed as undefined will be sent as null to Appwrite,
   * overwriting the stored value. Prefer `patchUserProfile` for partial updates.
   */
  async updateUserProfile(profileId, data) {
    const {
      DOB,
      address,
      email,
      gradeLevel,
      parentContact,
      phone,
      profileImage,
      experience,
      userName,
      role,
      specialization,
      onboardingStep,
      isProfileComplete,
    } = data;

    // Build the payload — only include keys that were explicitly provided in `data`.
    // This prevents wiping fields that the caller didn't intend to touch.
    const updatedData = {};

    // String / nullable fields — only write when key is present in data object
    if ("DOB" in data) updatedData.DOB = DOB || null;
    if ("address" in data) updatedData.address = address || null;
    if ("email" in data) updatedData.email = email || null;
    if ("gradeLevel" in data) updatedData.gradeLevel = gradeLevel || null;
    if ("parentContact" in data) updatedData.parentContact = parseInt(parentContact) || null;
    if ("phone" in data) updatedData.phone = parseInt(phone) || null;
    if ("profileImage" in data) updatedData.profileImage = profileImage || null;
    if ("experience" in data) updatedData.experience = experience || null;

    if ("userName" in data) updatedData.userName = userName || null;
    if ("role" in data) updatedData.role = role || null;
    if ("specialization" in data) updatedData.specialization = specialization || [];

    // Boolean / profile fields — preserve only when explicitly provided
    if (onboardingStep !== undefined) updatedData.onboardingStep = onboardingStep;
    if (isProfileComplete !== undefined) updatedData.isProfileComplete = isProfileComplete;

    try {
      const response = await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.userProfilesCollectionId,
        rowId: profileId,
        data: updatedData
      });

      if (response && response.userId) {
        this.profileCache.set(response.userId, response);
      }

      return response;
    } catch (error) {
      console.error("Appwrite error: updating user profile:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  /**
   * Patch update — sends ONLY the provided fields to Appwrite.
   * Safe for partial updates (approval actions, onboarding steps, etc.)
   * without touching unrelated fields.
   *
   * @param {string} profileId - profile document $id
   * @param {object} fields    - only the fields to update
   */
  async patchUserProfile(profileId, fields) {
    if (!profileId || !fields || Object.keys(fields).length === 0) {
      throw new Error("patchUserProfile: profileId and fields are required.");
    }

    const payload = { ...fields };

    try {
      const response = await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.userProfilesCollectionId,
        rowId: profileId,
        data: payload
      });

      if (response && response.userId) {
        this.profileCache.set(response.userId, response);
      }

      return response;
    } catch (error) {
      console.error("Appwrite error: patchUserProfile:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteUserProfile(profileId) {
    try {
      this.profileCache.clear();
      return await this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: conf.userProfilesCollectionId,
        rowId: profileId
      });
    } catch (error) {
      console.error("Appwrite error: deleting user profile:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getBatchUserProfile(query) {
    try {
      const userProfiles = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.userProfilesCollectionId,
        queries: [...query]
      });

      if (userProfiles && userProfiles.rows) {
        userProfiles.rows.forEach(p => {
          if (p.userId) {
            this.profileCache.set(p.userId, p);
          }
        });
      }

      return userProfiles.rows;
    } catch (error) {
      console.error("Appwrite error: get batch user profiles:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getUserProfile(userId) {
    if (!userId) {
      console.warn("[DEBUG] getUserProfile returning early because userId is falsy!");
      return false; 
    }

    // 1. Check if we already have a cached profile (avoid redundant reads)
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId);
    }

    // 2. Check if a fetch request is already in-flight for this user (deduplicate concurrent requests)
    if (this.profileRequests.has(userId)) {
      console.log("[DEBUG] Merging with existing in-flight request for userId:", userId);
      return this.profileRequests.get(userId);
    }

    const promise = (async () => {
      try {
        const userProfile = await this.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.userProfilesCollectionId,
          queries: [Query.equal("userId", String(userId))]
        });

        if (userProfile.total === 0) {
          this.profileCache.set(userId, false);
          return false;
        }

        const profile = userProfile.rows[0];

        // ── Auto-patch missing isProfileComplete field ──────────────────────────
        // Profiles created before this field existed have isProfileComplete: undefined.
        // Run checkProfileCompletion on the raw data and silently patch DB if needed.
        if (profile.isProfileComplete === undefined || profile.isProfileComplete === null) {
          const { isComplete } = checkProfileCompletion(profile);
          profile.isProfileComplete = isComplete;
          if (isComplete && profile.$id) {
            // Fire-and-forget — patch DB in background, don't block the return
            this.database.updateRow({
              databaseId: conf.databaseId,
              tableId: conf.userProfilesCollectionId,
              rowId: profile.$id,
              data: { isProfileComplete: true }
            }).catch((e) => console.warn("[auto-patch] Failed to patch isProfileComplete:", e));
          }
        }

        this.profileCache.set(userId, profile);
        return profile;
      } catch (error) {
        console.error("[DEBUG] Caught an error in getUserProfile:", error);
        if (error?.code === 402 || error?.type === "limit_databases_reads_exceeded") {
          console.error("[DEBUG] Quota exceeded error!");
          throw error;
        }
        return false;
      } finally {
        // Clean up from the active request cache once resolved/rejected
        this.profileRequests.delete(userId);
      }
    })();

    this.profileRequests.set(userId, promise);
    return promise;
  }

  /**
   * Clears the entire profile cache.
   * Call this on logout to prevent stale profile data persisting across sessions
   * in the same browser tab (the service is a singleton).
   */
  clearCache() {
    this.profileCache.clear();
    this.profileRequests.clear();
  }

  /**
   * DEPRECATED: getProfilesByBatchId.
   * batchId attribute was removed from userProfiles during normalization.
   * Student-Batch mappings must exclusively use batchStudentService or batchRequestService.
   */
  async getProfilesByBatchId() {
    console.warn("DEPRECATED: getProfilesByBatchId called. Returning empty array [] to prevent schema crash.");
    return [];
  }
}

const userProfileService = new UserProfileService();

export default userProfileService;
