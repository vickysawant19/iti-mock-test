import { fixProfileImage } from "@/services/appwriteClient";

export function fixProfileImageUrl(url) {
  return fixProfileImage(url);
}

export default fixProfileImageUrl;
