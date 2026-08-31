/**
 * Validation & Integrity Suite for Question Migration
 * Audits documents to verify zero data loss, valid hashes, option count parity, and search fields.
 */

import { tablesDb, Query } from "../core/appwriteClient";
import conf from "../../config/config";

export interface IntegrityIssue {
  documentId: string;
  issueType:
    | "DATA_LOSS"
    | "OPTION_COUNT_MISMATCH"
    | "INVALID_ANSWER"
    | "MISSING_HASH"
    | "SEARCH_TEXT_EMPTY"
    | "UNMIGRATED";
  message: string;
  details?: any;
}

export interface ValidationSummary {
  totalAudited: number;
  validCount: number;
  invalidCount: number;
  issues: IntegrityIssue[];
  isValid: boolean;
}

export async function validateCollectionIntegrity(
  onProgress?: (audited: number, total: number) => void
): Promise<ValidationSummary> {
  const dbId = conf.databaseId;
  const colId = conf.quesCollectionId;
  const issues: IntegrityIssue[] = [];

  let offset = 0;
  const limit = 100;
  let totalDocs = 0;
  let auditedCount = 0;
  let validCount = 0;

  try {
    const countRes = await tablesDb.listRows(dbId, colId, [Query.limit(1)]);
    totalDocs = countRes.total;
  } catch (err: any) {
    throw new Error(`Failed to initialize collection validation: ${err.message}`);
  }

  while (offset < totalDocs) {
    const res = await tablesDb.listRows(dbId, colId, [
      Query.limit(limit),
      Query.offset(offset),
    ]);

    const docs = (res as any).rows || (res as any).documents || [];

    for (const doc of docs) {
      auditedCount++;
      let docHasIssue = false;

      // Rule 1: Check original question and options presence (Zero Data Loss)
      if (!doc.question || typeof doc.question !== "string") {
        issues.push({
          documentId: doc.$id,
          issueType: "DATA_LOSS",
          message: "Original 'question' field is empty or corrupted.",
        });
        docHasIssue = true;
      }

      if (!Array.isArray(doc.options) || doc.options.length === 0) {
        issues.push({
          documentId: doc.$id,
          issueType: "DATA_LOSS",
          message: "Original 'options' array is missing or empty.",
        });
        docHasIssue = true;
      }

      // Rule 2: Check correct answer presence
      if (!doc.correctAnswer) {
        issues.push({
          documentId: doc.$id,
          issueType: "INVALID_ANSWER",
          message: "Question missing 'correctAnswer'.",
        });
        docHasIssue = true;
      }

      // If document is marked completed, audit migrated fields
      if (doc.migrationStatus === "completed") {
        // Rule 3: Option count parity check
        if (
          Array.isArray(doc.optionsEnglish) &&
          doc.optionsEnglish.length !== doc.options.length
        ) {
          issues.push({
            documentId: doc.$id,
            issueType: "OPTION_COUNT_MISMATCH",
            message: `optionsEnglish count (${doc.optionsEnglish.length}) does not match options count (${doc.options.length}).`,
          });
          docHasIssue = true;
        }

        // Rule 4: Hash fields presence check
        if (!doc.exactDuplicateHash || !doc.normalizedHash) {
          issues.push({
            documentId: doc.$id,
            issueType: "MISSING_HASH",
            message: "Missing exactDuplicateHash or normalizedHash.",
          });
          docHasIssue = true;
        }

        // Rule 5: Search text presence check
        if (!doc.searchText) {
          issues.push({
            documentId: doc.$id,
            issueType: "SEARCH_TEXT_EMPTY",
            message: "Search text index field is empty.",
          });
          docHasIssue = true;
        }
      } else {
        issues.push({
          documentId: doc.$id,
          issueType: "UNMIGRATED",
          message: `Document status is '${doc.migrationStatus || "pending"}'.`,
        });
        docHasIssue = true;
      }

      if (!docHasIssue) {
        validCount++;
      }

      if (onProgress) onProgress(auditedCount, totalDocs);
    }

    offset += limit;
  }

  return {
    totalAudited: auditedCount,
    validCount,
    invalidCount: issues.length,
    issues,
    isValid: issues.length === 0,
  };
}
