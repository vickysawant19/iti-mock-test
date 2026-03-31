/**
 * One-time migration script: Teacher Approval Activation System
 *
 * 1. Adds 3 new attributes to userProfiles collection:
 *    - isApproved (boolean, default: false)
 *    - approvalStatus (enum: pending|approved|rejected, default: "pending")
 *    - approvedBy (string, nullable)
 *
 * 2. Auto-approves all existing complete user profiles so existing
 *    users are not disrupted by the new approval gate.
 *
 * Run: node scripts/approve_existing_users.js
 */

import fetch from "node-fetch";

const ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "itimocktest";
const DATABASE_ID = "itimocktest";
const COLLECTION_ID = "66937340001047368f32"; // userProfiles
const API_KEY =
  "standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125";

const headers = {
  "Content-Type": "application/json",
  "X-Appwrite-Project": PROJECT_ID,
  "X-Appwrite-Key": API_KEY,
};

// ──────────────────────────────────────────────────────────────────────────────
// Helper: Create an attribute and tolerate "already exists" (409)
// ──────────────────────────────────────────────────────────────────────────────
async function safeCreateAttribute(url, body, label) {
  console.log(`Adding attribute: ${label}...`);
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (res.ok || res.status === 409) {
    console.log(`  ✅ ${label} ready`);
  } else {
    const err = await res.json();
    console.error(`  ❌ Failed to add ${label}:`, err.message);
  }

  // Appwrite needs a short pause between attribute creations
  await new Promise((r) => setTimeout(r, 1500));
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 1: Create all three attributes
// ──────────────────────────────────────────────────────────────────────────────
async function addAttributes() {
  const base = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes`;

  // isApproved: boolean, default false
  await safeCreateAttribute(
    `${base}/boolean`,
    { key: "isApproved", required: false, default: false },
    "isApproved (Boolean)"
  );

  // approvalStatus: enum
  await safeCreateAttribute(
    `${base}/enum`,
    {
      key: "approvalStatus",
      elements: ["pending", "approved", "rejected"],
      required: false,
      default: "pending",
    },
    "approvalStatus (Enum)"
  );

  // approvedBy: string (teacherId), nullable
  await safeCreateAttribute(
    `${base}/string`,
    { key: "approvedBy", size: 50, required: false, default: null },
    "approvedBy (String)"
  );

  // Give Appwrite a moment to finalise the schema
  console.log("Waiting 3s for schema to settle...");
  await new Promise((r) => setTimeout(r, 3000));
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 2: Auto-approve all existing complete profiles
// ──────────────────────────────────────────────────────────────────────────────
async function migrateExistingUsers() {
  console.log("\nFetching existing profiles...");

  let offset = 0;
  const limit = 100;
  let approvedCount = 0;
  let total = Infinity;

  while (offset < total) {
    const listUrl = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?limit=${limit}&offset=${offset}`;
    const res = await fetch(listUrl, { headers });
    const data = await res.json();

    total = data.total;
    const docs = data.documents || [];

    for (const doc of docs) {
      // Auto-approve if:
      // - isProfileComplete is true (student finished onboarding), OR
      // - role includes Teacher (teachers are always approved)
      const isTeacher = Array.isArray(doc.role) && doc.role.includes("Teacher");
      const shouldApprove = doc.isProfileComplete === true || isTeacher;

      if (shouldApprove && doc.approvalStatus !== "approved") {
        const updateUrl = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${doc.$id}`;
        const updateRes = await fetch(updateUrl, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            isApproved: true,
            approvalStatus: "approved",
            approvedBy: null,
          }),
        });

        if (updateRes.ok) {
          approvedCount++;
          console.log(`  ✅ Auto-approved: ${doc.userName || doc.$id}`);
        } else {
          const err = await updateRes.json();
          console.error(`  ❌ Failed to approve ${doc.$id}:`, err.message);
        }
      }
    }

    offset += docs.length;
    if (docs.length < limit) break;
  }

  console.log(`\n✅ Migration complete. Auto-approved ${approvedCount} profiles.`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log("=== Teacher Approval System - DB Migration ===\n");
    await addAttributes();
    await migrateExistingUsers();
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
})();
