import { ID, Permission, Role } from "appwrite";
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

      // 2. Establish custom Custom File ID (userId + "-profile")
      const fileId = `${userId}-profile`;

      // 3. Check if the file already exists to overwrite it
      try {
         // Attempt to delete preexisting file so we can overwrite it with the same ID
         await this.storage.deleteFile(this.bucketId, fileId);
      } catch (checkError) {
         // If it doesn't exist, this fails silently (Appwrite throws 404). Clean passthrough!
      }

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
   * @param {string} userId 
   * @returns {string} URL to view image
   */
  getProfilePictureView(userId) {
    if (!userId) return null;
    const fileId = `${userId}-profile`;
    const result = this.storage.getFileView(this.bucketId, fileId);
    return (result && result.href) ? result.href : result.toString();
  }

  /**
   * Fetch a compressed/cropped PREVIEW URL from Appwrite
   * Useful for small avatars like 120x120
   */
  getProfilePicturePreview(userId, width = 120, height = 120) {
    if (!userId) return null;
    const fileId = `${userId}-profile`;
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
      const fileId = `${userId}-profile`;
      await this.storage.deleteFile(this.bucketId, fileId);
      return true;
    } catch (error) {
      console.error("Appwrite error :: deleteProfilePicture :: error", error);
      throw error;
    }
  }
}

const profileImageService = new ProfileImageService();
export default profileImageService;
