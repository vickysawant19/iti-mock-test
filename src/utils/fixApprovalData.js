/**
 * fixApprovalData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Safe migration utility to fix inconsistent approval-related fields
 * in existing user profiles.
 *
 * Problems fixed:
 *   1. approvalStatus = "approved" but isApproved = false
 *      → set isApproved = true  (most common inconsistency)
 *
 *   2. approvalStatus = "rejected" but isApproved = true
 *      → set isApproved = false (keep locked out)
 *
 * What we do NOT change:
 *   - batchId (even if approvalStatus is not "approved")
 *     Some teachers manually assigned students; clearing batchId would break data.
 *   - enrollmentStatus (too risky to auto-change without more context)
 *
 * Usage (browser console on the Appwrite web app, or inside a React component):
 *   import { runApprovalDataFix } from "@/utils/fixApprovalData";
 *   const report = await runApprovalDataFix();
 *   console.table(report);
 */

import { Query } from "appwrite";
import conf from "@/config/config";
import { appwriteService } from "@/appwrite/appwriteConfig";
import userProfileService from "@/appwrite/userProfileService";

/**
 * Scans all user profile documents and patches those with inconsistent
 * approval fields. Returns a report of changes made.
 *
 * @returns {Promise<{fixed: number, scanned: number, errors: string[], changes: Array}>}
 */
export async function runApprovalDataFix() {
  const db = appwriteService.getDatabases();
  const report = {
    scanned: 0,
    fixed: 0,
    errors: [],
    changes: [],
  };

  try {
    // Fetch all profiles in batches of 100
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const res = await db.listDocuments(
        conf.databaseId,
        conf.userProfilesCollectionId,
        [Query.limit(limit), Query.offset(offset)]
      );

      const docs = res.documents;
      report.scanned += docs.length;

      for (const doc of docs) {
        const profileId = doc.$id;
        const { approvalStatus, isApproved, userId, userName } = doc;
        const patch = {};
        const reasons = [];

        // Fix 1: approved status but access flag is false
        if (approvalStatus === "approved" && isApproved === false) {
          patch.isApproved = true;
          reasons.push("set isApproved=true (was approved but flagged false)");
        }

        // Fix 2: rejected status but access flag is still true
        if (approvalStatus === "rejected" && isApproved === true) {
          patch.isApproved = false;
          reasons.push("set isApproved=false (was rejected but flag was true)");
        }

        if (Object.keys(patch).length > 0) {
          try {
            await userProfileService.patchUserProfile(profileId, patch);
            report.fixed++;
            report.changes.push({
              profileId,
              userId,
              userName,
              patch,
              reasons,
            });
            console.log(`✅ Fixed profile ${profileId} (${userName}):`, reasons);
          } catch (err) {
            const msg = `Failed to patch ${profileId}: ${err.message}`;
            report.errors.push(msg);
            console.error(`❌ ${msg}`);
          }
        }
      }

      // Check if there are more pages
      hasMore = docs.length === limit && offset + limit < res.total;
      offset += limit;
    }
  } catch (err) {
    report.errors.push(`Fatal error during scan: ${err.message}`);
    console.error("runApprovalDataFix: fatal error:", err);
  }

  console.group("📊 Approval Data Fix Report");
  console.log(`Scanned: ${report.scanned} profiles`);
  console.log(`Fixed: ${report.fixed} profiles`);
  if (report.errors.length > 0) {
    console.warn(`Errors (${report.errors.length}):`, report.errors);
  }
  if (report.changes.length > 0) {
    console.table(report.changes);
  }
  console.groupEnd();

  return report;
}
