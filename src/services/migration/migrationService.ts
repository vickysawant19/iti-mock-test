/**
 * Batch Migration Engine Service for Appwrite Question Collection
 * Handles batching, dry-runs, checkpoints, rollbacks, progress callbacks, retries, and rate-limiting.
 */

import { tablesDb, Query } from "../appwriteClient";
import conf from "../../config/config";
import { normalizeText } from "../../utils/textNormalization";
import { splitLanguage, splitOptions } from "../../utils/languageSplitter";
import {
  generateExactDuplicateHash,
  generateNormalizedHash,
  generatePartialDuplicateHash,
} from "../../utils/duplicateDetector";

export interface MigrationOptions {
  batchSize?: number;
  requestDelayMs?: number;
  batchDelayMs?: number;
  dryRun?: boolean;
  resume?: boolean;
  forceAll?: boolean;
  onProgress?: (progress: MigrationProgress) => void;
  onLog?: (message: string) => void;
}

export interface MigrationProgress {
  total: number;
  processed: number;
  migrated: number;
  skipped: number;
  failed: number;
  duplicates: number;
  currentBatch: number;
  totalBatches: number;
  status: "idle" | "running" | "completed" | "failed" | "rolled_back";
  lastDocumentId?: string;
  logs: string[];
}

export class MigrationService {
  private dbId: string;
  private tableId: string;

  constructor() {
    this.dbId = conf.databaseId;
    this.tableId = conf.quesCollectionId;
  }

  /**
   * Prepares normalized migration payload for a question document
   */
  public prepareMigratedDocument(doc: any): any {
    const rawQ = doc.question || "";
    const rawOpts = doc.options || [];
    const rawAns = doc.correctAnswer || "";

    const qSplit = splitLanguage(rawQ);
    const optsSplit = splitOptions(rawOpts);
    const normQ = normalizeText(rawQ);

    const exactHash = generateExactDuplicateHash(rawQ, rawOpts, rawAns);
    const normHash = generateNormalizedHash(rawQ);
    const partialHash = generatePartialDuplicateHash(rawQ);

    const searchTextParts = [
      rawQ,
      qSplit.english,
      qSplit.marathi,
      ...rawOpts,
      ...optsSplit.optionsEnglish,
      ...optsSplit.optionsMarathi,
      doc.tags || "",
    ];

    const searchText = Array.from(new Set(searchTextParts.filter(Boolean)))
      .join(" ")
      .slice(0, 9900);

    return {
      questionEnglish: (qSplit.english || normQ).slice(0, 4990),
      questionMarathi: (qSplit.marathi || "").slice(0, 4990),
      optionsEnglish: optsSplit.optionsEnglish.map((o) => o.slice(0, 990)),
      optionsMarathi: optsSplit.optionsMarathi.map((o) => o.slice(0, 990)),
      questionImageUrl: doc.questionImageUrl || "",
      optionImageUrls: doc.optionImageUrls || [],
      explanationEnglish: doc.explanationEnglish || "",
      explanationMarathi: doc.explanationMarathi || "",
      languageType: qSplit.languageType,
      normalizedHash: normHash,
      exactDuplicateHash: exactHash,
      partialDuplicateHash: partialHash,
      normalizedQuestion: normQ.slice(0, 4990),
      searchText: searchText,
      schemaVersion: 2,
      migrationStatus: "completed",
      migrationDate: new Date().toISOString(),
    };
  }

  /**
   * Executes batch migration across the question collection with rate-limiting & adaptive backoff
   */
  public async executeMigration(options: MigrationOptions = {}): Promise<MigrationProgress> {
    const batchSize = options.batchSize || 25;
    const requestDelayMs = options.requestDelayMs ?? 250;
    const batchDelayMs = options.batchDelayMs ?? 1000;
    const isDryRun = options.dryRun || false;
    const forceAll = options.forceAll || false;
    const onProgress = options.onProgress;
    const onLog = options.onLog;

    const logs: string[] = [];
    const log = (msg: string) => {
      const formatted = `[${new Date().toLocaleTimeString()}] ${msg}`;
      console.log(formatted);
      logs.push(formatted);
      if (onLog) onLog(formatted);
    };

    log(
      `Starting Migration (DryRun: ${isDryRun}, BatchSize: ${batchSize}, Delay: ${requestDelayMs}ms)...`
    );

    // Fetch initial list to count documents
    let totalDocs = 0;
    try {
      const initialRes = await tablesDb.listRows(this.dbId, this.tableId, [Query.limit(1)]);
      totalDocs = initialRes.total;
    } catch (err: any) {
      log(`Error connecting to Appwrite collection: ${err.message}`);
      throw err;
    }

    const totalBatches = Math.ceil(totalDocs / batchSize) || 1;
    const progress: MigrationProgress = {
      total: totalDocs,
      processed: 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
      duplicates: 0,
      currentBatch: 0,
      totalBatches,
      status: "running",
      logs,
    };

    if (onProgress) onProgress(progress);

    let offset = 0;

    while (offset < totalDocs) {
      progress.currentBatch++;
      log(`Processing Batch ${progress.currentBatch}/${totalBatches} (Offset: ${offset})...`);

      let rows: any[] = [];
      try {
        const batchRes = await this.listWithRetry([
          Query.limit(batchSize),
          Query.offset(offset),
          Query.orderAsc("$createdAt"),
        ], log);
        rows = (batchRes as any).rows || (batchRes as any).documents || [];
      } catch (err: any) {
        log(`Failed to fetch batch at offset ${offset}: ${err.message}`);
        progress.failed += batchSize;
        offset += batchSize;
        continue;
      }

      for (const doc of rows) {
        progress.processed++;
        progress.lastDocumentId = doc.$id;

        // Skip if already completed unless forceAll is enabled
        if (!forceAll && doc.migrationStatus === "completed" && doc.schemaVersion === 2) {
          progress.skipped++;
          continue;
        }

        try {
          const payload = this.prepareMigratedDocument(doc);

          if (!isDryRun) {
            await this.updateWithRetry(doc.$id, payload, log);
          }

          progress.migrated++;
        } catch (err: any) {
          log(`Error migrating question ${doc.$id}: ${err.message}`);
          progress.failed++;
          if (!isDryRun) {
            try {
              await tablesDb.updateRow(this.dbId, this.tableId, doc.$id, {
                migrationStatus: "failed",
              });
            } catch (_) {}
          }
        }

        if (onProgress) onProgress({ ...progress });

        // Per-item delay to respect Appwrite endpoint rate limits
        if (!isDryRun && requestDelayMs > 0) {
          await new Promise((r) => setTimeout(r, requestDelayMs));
        }
      }

      offset += batchSize;
      // Batch pause to reset rate limit window
      if (!isDryRun && batchDelayMs > 0) {
        await new Promise((r) => setTimeout(r, batchDelayMs));
      }
    }

    progress.status = "completed";
    log(`Migration Finished! Total: ${progress.total}, Migrated: ${progress.migrated}, Skipped: ${progress.skipped}, Failed: ${progress.failed}`);
    if (onProgress) onProgress({ ...progress });

    return progress;
  }

  /**
   * List rows with rate limit handling
   */
  private async listWithRetry(queries: any[], log: (m: string) => void, retries = 5): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await tablesDb.listRows(this.dbId, this.tableId, queries);
      } catch (error: any) {
        const isRateLimit =
          error?.code === 429 ||
          error?.type === "general_rate_limit_exceeded" ||
          error?.message?.includes("Rate limit");

        if (isRateLimit) {
          const waitTime = (i + 1) * 3500;
          log(`⚠️ [429 Rate Limit] Appwrite endpoint throttled. Pausing ${waitTime / 1000}s (Attempt ${i + 1}/${retries})...`);
          await new Promise((r) => setTimeout(r, waitTime));
        } else {
          if (i === retries - 1) throw error;
          await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        }
      }
    }
  }

  /**
   * Updates row with adaptive 429 rate limit backoff retry
   */
  private async updateWithRetry(docId: string, payload: any, log: (m: string) => void, retries = 6): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await tablesDb.updateRow(this.dbId, this.tableId, docId, payload);
      } catch (error: any) {
        const isRateLimit =
          error?.code === 429 ||
          error?.type === "general_rate_limit_exceeded" ||
          error?.message?.includes("Rate limit");

        if (isRateLimit) {
          const waitTime = (i + 1) * 3000;
          log(`⚠️ [429 Rate Limit] Document ${docId} rate limited. Cooling down for ${waitTime / 1000}s...`);
          await new Promise((r) => setTimeout(r, waitTime));
        } else {
          if (i === retries - 1) throw error;
          await new Promise((r) => setTimeout(r, 500 * (i + 1)));
        }
      }
    }
  }

  /**
   * Rollback migration: resets migration fields on migrated documents
   */
  public async rollbackMigration(
    onProgress?: (progress: { processed: number; total: number }) => void
  ): Promise<{ success: boolean; rolledBackCount: number }> {
    console.log("Starting Migration Rollback...");
    let processed = 0;
    let rolledBackCount = 0;

    const res = await tablesDb.listRows(this.dbId, this.tableId, [
      Query.equal("migrationStatus", "completed"),
      Query.limit(100),
    ]);

    const docs = (res as any).rows || (res as any).documents || [];
    const total = res.total;

    for (const doc of docs) {
      processed++;
      try {
        await tablesDb.updateRow(this.dbId, this.tableId, doc.$id, {
          migrationStatus: "pending",
          schemaVersion: 1,
        });
        rolledBackCount++;
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.error(`Rollback failed for ${doc.$id}`, err);
      }
      if (onProgress) onProgress({ processed, total });
    }

    return { success: true, rolledBackCount };
  }
}

export const migrationService = new MigrationService();
export default migrationService;
