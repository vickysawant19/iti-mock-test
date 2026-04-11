import { ID, Permission, Role, Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class ProfileImageService {
  constructor() {
    this.storage = appwriteService.getStorage();
    this.bucketId = conf.profileImagesBucketId;
  }

  /**
   * Helper method to convert, resize, and sanitize an image on the client side.
   * Compresses the image, resizes if too large, and converts to WebP.
   * @param {File} file 
   * @param {number} maxSizeMB 
   * @returns {Promise<File>} Processed WebP File
   */
  async sanitizeAndConvertImage(file, maxSizeMB = 5) {
    return new Promise((resolve, reject) => {
      // 1. Size Limit Check
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return reject(new Error(`File size exceeds ${maxSizeMB}MB limit.`));
      }

      // 2. Format Sanitization Check
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return reject(new Error("Invalid file format. Please upload JPG, PNG, or WebP."));
      }

      // 3. Image Conversion and Resizing (HTML5 Canvas)
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        // Maximum dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format for high quality & low size
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Image conversion failed."));
            }
            // Return converted File object
            const convertedFile = new File([blob], "profile_picture.webp", {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(convertedFile);
          },
          "image/webp",
          0.85 // 85% compression quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load and parse the image file."));
      };

      img.src = objectUrl;
    });
  }

  /**
   * Upload or update a user's profile picture.
   * @param {File} file - Raw file selected by user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Appwrite File response
   */
  async uploadProfilePicture(file, userId) {
    try {
      if (!file || !userId) throw new Error("File and userId are required");

      // 1. Sanitize and Convert the image first
      const processedFile = await this.sanitizeAndConvertImage(file);

      // 2. Establish short custom File ID to stay under 36 chars limit
      const safeUserId = userId.length > 20 ? userId.substring(0, 20) : userId;
      const idPrefix = `${safeUserId}-p-`;
      
      // 3. Check if the file already exists to overwrite it
      try {
         // Find both old format and new format existing files
         const existingFiles = await this.storage.listFiles(this.bucketId, [
           Query.startsWith('$id', safeUserId)
         ]);
         
         const filesToDelete = existingFiles.files.filter(f => 
             f.$id.startsWith(idPrefix) || f.$id === `${userId}-profile`
         );
         
         for (const existingFile of filesToDelete) {
           await this.storage.deleteFile(this.bucketId, existingFile.$id);
         }
      } catch (checkError) {
         // Fails silently if no matching files or error reading
      }

      // Convert timestamp to base36 to save length (e.g. 8 chars)
      const ts = Date.now().toString(36);
      const fileId = `${idPrefix}${ts}`;

      // 4. Create (Upload) to Appwrite Bucket with explicit file-level permissions
      return await this.storage.createFile(
        this.bucketId,
        fileId,
        processedFile,
        [
          Permission.read(Role.any()),
          Permission.write(Role.any()), // Temporarily 'any' to ensure it routes past permissions limits, but user should configure roles later
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      );
    } catch (error) {
      console.error("Appwrite error :: uploadProfilePicture :: error", error);
      throw error; // Let UI handle toast
    }
  }

  /**
   * Fetch the view URL for a profile picture
   * @param {string} userIdOrFileId 
   * @returns {string} URL to view image
   */
  getProfilePictureView(userIdOrFileId) {
    if (!userIdOrFileId) return null;
    const isFullFileId = userIdOrFileId.includes('-p-') || userIdOrFileId.includes('-profile');
    const fileId = isFullFileId ? userIdOrFileId : `${userIdOrFileId}-profile`;
    const result = this.storage.getFileView(this.bucketId, fileId);
    return (result && result.href) ? result.href : result.toString();
  }

  /**
   * Resolve a profile picture URL directly from a userId.
   * Lists the bucket for files matching the user's upload prefix
   * (userId-p-*) and returns a preview URL for the latest file found.
   *
   * Use this when you only have a userId and the profileImage URL
   * is not stored in the profile document.
   *
   * @param {string} userId
   * @param {number} width  - preview width  (default 120)
   * @param {number} height - preview height (default 120)
   * @returns {Promise<string|null>}
   */
  async getProfileUrlByUserId(userId, width = 120, height = 120) {
    if (!userId) return null;
    try {
      const safeUserId = userId.length > 20 ? userId.substring(0, 20) : userId;
      const prefix = `${safeUserId}-p-`;

      const response = await this.storage.listFiles(this.bucketId, [
        Query.startsWith('$id', prefix),
      ]);

      const files = response?.files ?? [];
      if (files.length === 0) return null;

      const latest = files.sort((a, b) => b.$createdAt.localeCompare(a.$createdAt))[0];

      const result = this.storage.getFilePreview(
        this.bucketId,
        latest.$id,
        width,
        height,
        'center',
        100
      );
      return (result && result.href) ? result.href : result.toString();
    } catch {
      return null;
    }
  }

  /**
   * Bulk-resolve profile picture URLs for multiple users in one shot.
   * Runs all bucket lookups in parallel via Promise.all.
   *
   * Returns a Map<userId, url|null> so you can do O(1) lookups per row.
   *
   * Best used as a FALLBACK when profileImage is not stored in the DB.
   * If you already have profileImage URLs from a DB fetch, use those instead.
   *
   * @param {string[]} userIds  - array of user IDs
   * @param {number}   width    - preview width  (default 80)
   * @param {number}   height   - preview height (default 80)
   * @returns {Promise<Map<string, string|null>>}
   *
   * @example
   * const urlMap = await profileImageService.getBulkProfileUrls(userIds);
   * const avatarSrc = urlMap.get(userId); // string | null
   */
  async getBulkProfileUrls(userIds, width = 80, height = 80) {
    if (!userIds?.length) return new Map();

    const unique = [...new Set(userIds.filter(Boolean))];

    const results = await Promise.all(
      unique.map(async (uid) => {
        const url = await this.getProfileUrlByUserId(uid, width, height);
        return [uid, url];
      })
    );

    return new Map(results);
  }

  /**
   * Fetch a compressed/cropped PREVIEW URL from Appwrite
   * Useful for small avatars like 120x120
   */
  getProfilePicturePreview(userIdOrFileId, width = 120, height = 120) {
    if (!userIdOrFileId) return null;
    const isFullFileId = userIdOrFileId.includes('-p-') || userIdOrFileId.includes('-profile');
    const fileId = isFullFileId ? userIdOrFileId : `${userIdOrFileId}-profile`;
    const result = this.storage.getFilePreview(
      this.bucketId, 
      fileId, 
      width, 
      height, 
      "center", 
      100 // Quality
    );
    return (result && result.href) ? result.href : result.toString();
  }

  /**
   * Delete the profile picture
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async deleteProfilePicture(userId) {
    try {
      if (!userId) throw new Error("userId required");
      const safeUserId = userId.length > 20 ? userId.substring(0, 20) : userId;
      const existingFiles = await this.storage.listFiles(this.bucketId, [
         Query.startsWith('$id', safeUserId)
      ]);
      const filesToDelete = existingFiles.files.filter(f => 
          f.$id.startsWith(`${safeUserId}-p-`) || f.$id === `${userId}-profile`
      );
      for (const existingFile of filesToDelete) {
        await this.storage.deleteFile(this.bucketId, existingFile.$id);
      }
      return true;
    } catch (error) {
      console.error("Appwrite error :: deleteProfilePicture :: error", error);
      throw error;
    }
  }
}

const profileImageService = new ProfileImageService();
export default profileImageService;
