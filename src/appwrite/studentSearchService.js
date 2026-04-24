import { Query } from "appwrite";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";
import userProfileService from "./userProfileService";
import conf from "../config/config";

export class StudentSearchService {
  /**
   * Searches for students by matching in userProfile and Appwrite Auth
   * Returns merged array with `noProfile` flag for Auth-only users.
   */
  async searchStudents(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    try {
      // 1. Search in Appwrite Auth via Function Native Search
      let authResults = [];
      const func = appwriteService.getFunctions();
      const { responseBody } = await func.createExecution(
        conf.userManageFunctionId, // user-manage function ID
        JSON.stringify({ action: "searchUsers", searchTerm })
      );

      const response = JSON.parse(responseBody);
      
      console.log("Appwrite Function Logs:", response.logs || "No logs returned, ensure latest function is deployed.");
      
      if (response.success && response.data) {
        authResults = response.data;
      } else if (!response.success) {
        console.error("Auth search returned success: false", response);
      }

      if (authResults.length === 0) {
        return [];
      }

      // 2. Extract Auth User IDs to find their existing profiles
      const targetUserIds = authResults.map(user => user.$id);
      
      let profileResults = [];
      try {
        const profileDocs = await userProfileService.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.userProfilesCollectionId,

          queries: [
            Query.equal("userId", targetUserIds)
          ]
        });
        profileResults = profileDocs.rows || [];
      } catch (err) {
        console.warn("Could not query user profiles by userIds:", err);
      }

      // 3. Merge Results prioritizing userProfile data if they exist
      const mergedMap = new Map();

      // Setup map mapped by userId for fast check
      const profileMap = new Map(profileResults.map(p => [p.userId, p]));

      for (const authUser of authResults) {
        const existingProfile = profileMap.get(authUser.$id);
        
        if (existingProfile) {
          mergedMap.set(authUser.$id, {
            ...existingProfile,
            labels: authUser.labels || [],
            hasProfile: true,
            noProfile: false,
          });
        } else {
          mergedMap.set(authUser.$id, {
            userId: authUser.$id,
            userName: authUser.name || "Unknown User",
            email: authUser.email,
            phone: authUser.phone,
            labels: authUser.labels || [],
            hasProfile: false,
            noProfile: true,
          });
        }
      }

      return Array.from(mergedMap.values());
    } catch (error) {
      console.error("Error in searchStudents:", error);
      throw error;
    }
  }
}

const studentSearchService = new StudentSearchService();
export default studentSearchService;
