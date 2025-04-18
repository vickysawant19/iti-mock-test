import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";
import attendanceService from "./attaindanceService";

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
    status,
    studentId,
    tradeId,
    userId,
    userName,
    allBatchIds,
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
        specialization: specialization || null,
        status: status || null,
        studentId: studentId || null,
        tradeId: tradeId || null,
        userId: userId || null,
        userName: userName || null,
        allBatchIds: allBatchIds || [],
      };

      const response = await this.database.createDocument(
        conf.databaseId,
        conf.userProfilesCollectionId,
        "unique()",
        userProfile
      );
      return {
        ...response,
        allBatchIds: response.allBatchIds.map((itm) => JSON.parse(itm)),
      };
    } catch (error) {
      console.error("Appwrite error: creating user profile:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

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
      status,
      studentId,
      tradeId,
      userName,
      role,
      registerId,
      allBatchIds,
    } = data;

    const updatedData = {
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
      specialization: specialization || null,
      status: status || null,
      studentId: studentId || null,
      tradeId: tradeId || null,
      userName: userName || null,
      role: role || null,
      registerId: registerId || null,
      allBatchIds: allBatchIds || [],
    };

    try {
      const response = await this.database.updateDocument(
        conf.databaseId,
        conf.userProfilesCollectionId,
        profileId,
        updatedData
      );

      return {
        ...response,
        allBatchIds: response?.allBatchIds?.map((itm) => JSON.parse(itm)),
      };
    } catch (error) {
      console.error("Appwrite error: updating user profile:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteUserProfile(profileId) {
    try {
      return await this.database.deleteDocument(
        conf.databaseId,
        conf.userProfilesCollectionId,
        profileId
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
        [...query]
      );

      if (userProfiles.total === 0) {
        throw new Error("No user profiles found for the given batchId.");
      }

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
        [Query.equal("userId", userId)]
      );

      if (userProfile.total === 0) {
        throw new Error("User profile not found.");
      }

      const profile = userProfile.documents[0];

      return {
        ...profile,
        allBatchIds: profile.allBatchIds.map((itm) => JSON.parse(itm)),
      }; // Assuming user profile is unique per userId
    } catch (error) {
      console.log("Appwrite error: get user profile:", error);
      return false;
    }
  }
}

const userProfileService = new UserProfileService();

export default userProfileService;
