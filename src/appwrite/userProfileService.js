import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";
import batchService from "./batchService";

export class UserProfileService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async createUserProfile({
    DOB,
    address,
    assignedBatches,
    batchId,
    collegeId,
    email,
    enrolledAt = new Date().toISOString(),
    enrollmentStatus,
    gradeLevel,
    parentContact,
    phone,
    profileImage,
    role,
    specialization,
    experience,
    status,
    studentId,
    tradeId,
    userId,
    userName,
    allBatchIds,
    onboardingStep = 0,
    isProfileComplete = false,
  }) {
    try {
      const userProfile = {
        DOB: DOB || null,
        address: address || null,
        assignedBatches: assignedBatches || null,
        batchId: batchId || null,
        collegeId: collegeId || null,
        email: email || null,
        enrolledAt: enrolledAt || null,
        enrollmentStatus: enrollmentStatus || null,
        gradeLevel: gradeLevel || null,
        parentContact: parseInt(parentContact) || null,
        phone: parseInt(phone) || null,
        profileImage: profileImage || null,
        role: role || null,
        specialization: specialization ? (Array.isArray(specialization) ? specialization : specialization.split(",").map(s => s.trim()).filter(Boolean)) : [],
        experience: experience || null,
        status: status || null,
        studentId: studentId || null,
        tradeId: tradeId || null,
        userId: userId || null,
        userName: userName || null,
        allBatchIds: allBatchIds ? (typeof allBatchIds === "string" ? allBatchIds : JSON.stringify(allBatchIds)) : "[]",
        onboardingStep,
        isProfileComplete,
      };

      const response = await this.database.createDocument(
        conf.databaseId,
        conf.userProfilesCollectionId,
        "unique()",
        userProfile,
      );

      const parsedBatches = () => {
        try {
          return response?.allBatchIds ? JSON.parse(response.allBatchIds) : [];
        } catch(e) { return []; }
      };

      return {
        ...response,
        allBatchIds: parsedBatches(),
      };
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
        status: "Active",
        enrollmentStatus: "Pending", // Needs full profile to be fully active
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
      assignedBatches,
      batchId,
      collegeId,
      email,
      enrolledAt,
      enrollmentStatus,
      gradeLevel,
      parentContact,
      phone,
      profileImage,
      specialization,
      experience,
      status,
      studentId,
      tradeId,
      userName,
      role,
      registerId,
      allBatchIds,
      onboardingStep,
      isProfileComplete,
      isApproved,
      approvalStatus,
      approvedBy,
    } = data;

    // Build the payload — only include keys that were explicitly provided in `data`.
    // This prevents wiping fields that the caller didn't intend to touch.
    const updatedData = {};

    // String / nullable fields — only write when key is present in data object
    if ("DOB" in data) updatedData.DOB = DOB || null;
    if ("address" in data) updatedData.address = address || null;
    if ("assignedBatches" in data) updatedData.assignedBatches = assignedBatches || null;
    if ("batchId" in data) updatedData.batchId = batchId || null;
    if ("collegeId" in data) updatedData.collegeId = collegeId || null;
    if ("email" in data) updatedData.email = email || null;
    if ("enrolledAt" in data) updatedData.enrolledAt = enrolledAt || null;
    if ("enrollmentStatus" in data) updatedData.enrollmentStatus = enrollmentStatus || null;
    if ("gradeLevel" in data) updatedData.gradeLevel = gradeLevel || null;
    if ("parentContact" in data) updatedData.parentContact = parseInt(parentContact) || null;
    if ("phone" in data) updatedData.phone = parseInt(phone) || null;
    if ("profileImage" in data) updatedData.profileImage = profileImage || null;
    if ("experience" in data) updatedData.experience = experience || null;
    if ("status" in data) updatedData.status = status || null;
    if ("studentId" in data) updatedData.studentId = studentId || null;

    if ("specialization" in data) {
      updatedData.specialization = specialization
        ? (Array.isArray(specialization) ? specialization : specialization.split(",").map(s => s.trim()).filter(Boolean))
        : [];
    }
    if ("tradeId" in data) updatedData.tradeId = tradeId || null;
    if ("userName" in data) updatedData.userName = userName || null;
    if ("role" in data) updatedData.role = role || null;
    if ("registerId" in data) updatedData.registerId = registerId || null;

    // Appwrite stores allBatchIds as a single JSON string (max 5000 chars)
    if ("allBatchIds" in data) {
      updatedData.allBatchIds = data.allBatchIds 
        ? (typeof data.allBatchIds === "string" ? data.allBatchIds : JSON.stringify(data.allBatchIds))
        : "[]";
    }

    // Boolean / approval fields — preserve only when explicitly provided
    if (onboardingStep !== undefined) updatedData.onboardingStep = onboardingStep;
    if (isProfileComplete !== undefined) updatedData.isProfileComplete = isProfileComplete;

    try {
      const response = await this.database.updateDocument(
        conf.databaseId,
        conf.userProfilesCollectionId,
        profileId,
        updatedData,
      );

      const parsedBatches = () => {
        try {
          return response?.allBatchIds ? JSON.parse(response.allBatchIds) : [];
        } catch(e) { return []; }
      };

      return {
        ...response,
        allBatchIds: parsedBatches(),
      };
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

    // Re-serialize allBatchIds if present
    const payload = { ...fields };
    if ("allBatchIds" in payload) {
      payload.allBatchIds = payload.allBatchIds
        ? (typeof payload.allBatchIds === "string" ? payload.allBatchIds : JSON.stringify(payload.allBatchIds))
        : "[]";
    }

    try {
      const response = await this.database.updateDocument(
        conf.databaseId,
        conf.userProfilesCollectionId,
        profileId,
        payload,
      );

      const parsedBatches = () => {
        try {
          return response?.allBatchIds ? JSON.parse(response.allBatchIds) : [];
        } catch(e) { return []; }
      };

      return {
        ...response,
        allBatchIds: parsedBatches(),
      };
    } catch (error) {
      console.error("Appwrite error: patchUserProfile:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteUserProfile(profileId) {
    try {
      return await this.database.deleteDocument(
        conf.databaseId,
        conf.userProfilesCollectionId,
        profileId,
      );
    } catch (error) {
      console.error("Appwrite error: deleting user profile:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getBatchUserProfile(query) {
    try {
      const userProfiles = await this.database.listDocuments(
        conf.databaseId,
        conf.userProfilesCollectionId,
        [...query],
      );

      return userProfiles.documents.map(doc => ({
        ...doc,
        allBatchIds: (() => {
          try { return doc.allBatchIds ? JSON.parse(doc.allBatchIds) : []; }
          catch(e) { return []; }
        })()
      }));
    } catch (error) {
      console.error("Appwrite error: get batch user profiles:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getUserProfile(userId) {
    try {
      const userProfile = await this.database.listDocuments(
        conf.databaseId,
        conf.userProfilesCollectionId,
        [Query.equal("userId", userId)],
      );

      if (userProfile.total === 0) {
        throw new Error("User profile not found.");
      }

      const profile = userProfile.documents[0];
      const parsedBatches = () => {
        try {
          return profile?.allBatchIds ? JSON.parse(profile.allBatchIds) : [];
        } catch(e) { return []; }
      };

      return {
        ...profile,
        allBatchIds: parsedBatches(),
      }; // Assuming user profile is unique per userId
    } catch (error) {
      console.log("Appwrite error: get user profile:", error);
      return false;
    }
  }

  /**
   * Get all user profiles that have a specific batch target configured.
   * Useful for finding targeted students who haven't generated requests.
   */
  async getProfilesByBatchId(batchId) {
    if (!batchId) return [];
    try {
      const response = await this.database.listDocuments(
        conf.databaseId,
        conf.userProfilesCollectionId,
        [
          Query.equal("batchId", batchId),
          Query.limit(100)
        ]
      );
      return response.documents;
    } catch (error) {
      console.error(`Appwrite error: getProfilesByBatchId(${batchId}):`, error);
      return [];
    }
  }
}

const userProfileService = new UserProfileService();

export default userProfileService;
