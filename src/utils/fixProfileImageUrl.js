import { fixProfileImage } from "@/services/core/appwriteClient";

export function fixProfileImageUrl(url) {
  return fixProfileImage(url);
}

export default fixProfileImageUrl;
