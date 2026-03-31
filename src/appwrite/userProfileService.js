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
    // Approval fields – default to pending for all new profiles
    isApproved = false,
    approvalStatus = "pending",
    approvedBy = null,
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
        isApproved,
        approvalStatus,
        approvedBy: approvedBy || null,
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
    if (isApproved !== undefined) updatedData.isApproved = isApproved;
    if (approvalStatus !== undefined) updatedData.approvalStatus = approvalStatus;
    if (approvedBy !== undefined) updatedData.approvedBy = approvedBy || null;

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
   * Approve a student — called by a teacher.
   * Uses patchUserProfile so only approval fields are touched.
   *
   * @param {string} profileId  - profile document $id
   * @param {string} teacherId  - approving teacher's userId
   * @param {string} [batchId]  - confirmed batch (teacher-selected)
   */
  async approveStudent(profileId, teacherId, batchId) {
    const payload = {
      isApproved: true,
      approvalStatus: "approved",
      approvedBy: teacherId,
      enrollmentStatus: "Active",
      status: "Active",
    };
    
    // Fetch profile early so we can synchronize to the batch
    const profile = await this.database.getDocument(conf.databaseId, conf.userProfilesCollectionId, profileId);
    
    const targetBatchId = batchId || profile.batchId;
    if (targetBatchId) payload.batchId = targetBatchId;

    const result = await this.patchUserProfile(profileId, payload);
    
    // Synchronize to the batch table array
    if (targetBatchId) {
      await batchService.addStudentToBatchSync(targetBatchId, profile);
    }
    return result;
  }

  /**
   * Reject a student — called by a teacher.
   * Uses patchUserProfile so only approval fields are touched.
   */
  async rejectStudent(profileId, teacherId) {
    // Fetch profile to untether from the batch specifically
    const profile = await this.database.getDocument(conf.databaseId, conf.userProfilesCollectionId, profileId);
    
    const result = await this.patchUserProfile(profileId, {
      isApproved: false,
      approvalStatus: "rejected",
      approvedBy: teacherId,
      enrollmentStatus: "not_enrolled",
      status: "Inactive",
    });
    
    // Eject from the batch table array
    const targetBatchId = profile.batchId?.$id || profile.batchId;
    if (targetBatchId && profile.userId) {
      await batchService.removeStudentFromBatchSync(targetBatchId, profile.userId);
    }
    return result;
  }

  /**
   * Re-submit approval request — called by a rejected student who has edited details.
   * Uses patchUserProfile so only approval fields are touched.
   */
  async reRequestApproval(profileId) {
    return this.patchUserProfile(profileId, {
      isApproved: false,
      approvalStatus: "pending",
      approvedBy: null,
    });
  }

  /**
   * Reassign a student to a different batch after approval.
   * Only updates batchId — does not change approval status.
   *
   * @param {string} profileId  - profile document $id
   * @param {string} newBatchId - new batch to assign
   * @param {string} teacherId  - teacher performing the reassignment
   */
  async reassignStudentBatch(profileId, newBatchId, teacherId) {
    if (!newBatchId) throw new Error("reassignStudentBatch: newBatchId is required.");
    
    const profile = await this.database.getDocument(conf.databaseId, conf.userProfilesCollectionId, profileId);
    
    const result = await this.patchUserProfile(profileId, {
      batchId: newBatchId,
      approvedBy: teacherId, // Update who last touched this
    });

    const oldBatchId = profile.batchId?.$id || profile.batchId;
    if (oldBatchId && oldBatchId !== newBatchId && profile.userId) {
      await batchService.removeStudentFromBatchSync(oldBatchId, profile.userId);
    }
    
    await batchService.addStudentToBatchSync(newBatchId, profile);
    
    return result;
  }

  /**
   * Get students by approvalStatus scoped to a teacher's colleges & trades.
   *
   * Instead of filtering by batchId (which pending students don't have confirmed),
   * we filter by the set of collegeIds and tradeIds that appear in the teacher's batches.
   * This is the correct decoupled approach.
   *
   * @param {string}   status     - "pending" | "approved" | "rejected"
   * @param {string[]} collegeIds - from teacher's batches
   * @param {string[]} tradeIds   - from teacher's batches
   */
  async getStudentsByApprovalStatus(status, collegeIds, tradeIds) {
    if (!collegeIds?.length || !tradeIds?.length) return [];
    try {
      const queries = [
        Query.equal("approvalStatus", status),
        Query.equal("collegeId", collegeIds),
        Query.equal("tradeId", tradeIds),
        Query.limit(100),
      ];
      const res = await this.database.listDocuments(
        conf.databaseId,
        conf.userProfilesCollectionId,
        queries
      );
      return res.documents.map((doc) => ({
        ...doc,
        allBatchIds: (() => {
          try { return doc.allBatchIds ? JSON.parse(doc.allBatchIds) : []; }
          catch(e) { return []; }
        })(),
      }));
    } catch (error) {
      console.error(`Appwrite error: getStudentsByApprovalStatus(${status}):`, error);
      return [];
    }
  }

  async getPendingStudents(collegeIds, tradeIds) {
    return this.getStudentsByApprovalStatus("pending", collegeIds, tradeIds);
  }
}

const userProfileService = new UserProfileService();

export default userProfileService;
