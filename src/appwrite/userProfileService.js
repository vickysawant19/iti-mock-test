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
    batchId,
    email,
    enrolledAt = new Date().toISOString(),
    enrollmentStatus,
    gradeLevel,
    parentContact,
    phone,
    profileImage,
    role,
    experience,
    status,
    studentId,
    userId,
    userName,
    onboardingStep = 0,
    isProfileComplete = false,
  }) {
    try {
      const userProfile = {
        DOB: DOB || null,
        address: address || null,
        batchId: batchId || null,
        email: email || null,
        enrolledAt: enrolledAt || null,
        enrollmentStatus: enrollmentStatus || "enrolled",
        gradeLevel: gradeLevel || null,
        parentContact: parseInt(parentContact) || null,
        phone: parseInt(phone) || null,
        profileImage: profileImage || null,
        role: role || null,
        experience: experience || null,
        status: status || "active",
        studentId: studentId || null,
        userId: userId || null,
        userName: userName || null,
        onboardingStep,
        isProfileComplete,
      };

      const response = await this.database.createDocument(
        conf.databaseId,
        conf.userProfilesCollectionId,
        "unique()",
        userProfile,
      );

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
      batchId,
      email,
      enrolledAt,
      enrollmentStatus,
      gradeLevel,
      parentContact,
      phone,
      profileImage,
      experience,
      status,
      studentId,
      userName,
      role,
      registerId,
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
    if ("batchId" in data) updatedData.batchId = batchId || null;
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

    if ("userName" in data) updatedData.userName = userName || null;
    if ("role" in data) updatedData.role = role || null;
    if ("registerId" in data) updatedData.registerId = registerId || null;



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
      const response = await this.database.updateDocument(
        conf.databaseId,
        conf.userProfilesCollectionId,
        profileId,
        payload,
      );

      return response;
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

      return userProfiles.documents;
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
      return profile; // Assuming user profile is unique per userId
    } catch (error) {
      console.log("Appwrite error: get user profile:", error);
      return false;
    }
  }

  /**
   * DEPRECATED: getProfilesByBatchId.
   * batchId attribute was removed from userProfiles during normalization.
   * Student-Batch mappings must exclusively use batchStudentService or batchRequestService.
   */
  async getProfilesByBatchId(batchId) {
    console.warn("DEPRECATED: getProfilesByBatchId called. Returning empty array [] to prevent schema crash.");
    return [];
  }
}

const userProfileService = new UserProfileService();

export default userProfileService;
