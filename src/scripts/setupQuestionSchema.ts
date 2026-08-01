/**
 * Appwrite Question Collection Schema Setup Script
 * Ensures all new required attributes and indexes exist on the Question collection.
 */

import { databases, tablesDb } from "../services/appwriteClient";
import conf from "../config/config";

export interface SchemaAttributeDef {
  key: string;
  type: "string" | "enum" | "integer";
  size?: number;
  array?: boolean;
  required?: boolean;
  default?: any;
  elements?: string[];
}

export const NEW_SCHEMA_ATTRIBUTES: SchemaAttributeDef[] = [
  { key: "questionEnglish", type: "string", size: 5000, required: false, default: "" },
  { key: "questionMarathi", type: "string", size: 5000, required: false, default: "" },
  { key: "optionsEnglish", type: "string", size: 1000, array: true, required: false, default: [] },
  { key: "optionsMarathi", type: "string", size: 1000, array: true, required: false, default: [] },
  { key: "questionImageUrl", type: "string", size: 1000, required: false, default: "" },
  { key: "optionImageUrls", type: "string", size: 1000, array: true, required: false, default: [] },
  { key: "explanationEnglish", type: "string", size: 5000, required: false, default: "" },
  { key: "explanationMarathi", type: "string", size: 5000, required: false, default: "" },
  { key: "languageType", type: "string", size: 50, required: false, default: "unknown" },
  { key: "normalizedHash", type: "string", size: 256, required: false, default: "" },
  { key: "exactDuplicateHash", type: "string", size: 256, required: false, default: "" },
  { key: "partialDuplicateHash", type: "string", size: 256, required: false, default: "" },
  { key: "normalizedQuestion", type: "string", size: 5000, required: false, default: "" },
  { key: "searchText", type: "string", size: 10000, required: false, default: "" },
  { key: "schemaVersion", type: "integer", required: false, default: 2 },
  { key: "migrationStatus", type: "string", size: 50, required: false, default: "pending" },
  { key: "migrationDate", type: "string", size: 100, required: false, default: "" },
];

export const NEW_SCHEMA_INDEXES = [
  { key: "key_normalizedHash", type: "key", attributes: ["normalizedHash"] },
  { key: "key_exactDuplicateHash", type: "key", attributes: ["exactDuplicateHash"] },
  { key: "key_partialDuplicateHash", type: "key", attributes: ["partialDuplicateHash"] },
  { key: "key_migrationStatus", type: "key", attributes: ["migrationStatus"] },
  { key: "key_languageType", type: "key", attributes: ["languageType"] },
  { key: "search_searchText", type: "fulltext", attributes: ["searchText", "tags"] },
];

export async function setupQuestionSchema(onProgress?: (msg: string) => void): Promise<{
  success: boolean;
  log: string[];
}> {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(`[Schema Setup] ${msg}`);
    logs.push(msg);
    if (onProgress) onProgress(msg);
  };

  log("Starting Appwrite Question Collection schema verification...");
  const dbId = conf.databaseId;
  const colId = conf.quesCollectionId;

  if (!dbId || !colId) {
    log("Error: Database ID or Question Collection ID missing in config.");
    return { success: false, log: logs };
  }

  try {
    for (const attr of NEW_SCHEMA_ATTRIBUTES) {
      log(`Checking attribute: '${attr.key}'...`);
      try {
        if (attr.type === "string") {
          await (databases as any).createStringAttribute(
            dbId,
            colId,
            attr.key,
            attr.size || 5000,
            attr.required || false,
            attr.default,
            attr.array || false
          );
        } else if (attr.type === "enum" && attr.elements) {
          await (databases as any).createEnumAttribute(
            dbId,
            colId,
            attr.key,
            attr.elements,
            attr.required || false,
            attr.default,
            attr.array || false
          );
        } else if (attr.type === "integer") {
          await (databases as any).createIntegerAttribute(
            dbId,
            colId,
            attr.key,
            attr.required || false,
            0,
            100,
            attr.default
          );
        }
        log(`Successfully created attribute: '${attr.key}'`);
      } catch (err: any) {
        if (
          err.message?.includes("already exists") ||
          err.code === 409 ||
          err.type === "attribute_already_exists"
        ) {
          log(`Attribute '${attr.key}' already exists in collection.`);
        } else {
          log(`Notice for '${attr.key}': ${err.message || err}`);
        }
      }
    }

    // Index Creation
    for (const idx of NEW_SCHEMA_INDEXES) {
      log(`Checking index: '${idx.key}'...`);
      try {
        await (databases as any).createIndex(
          dbId,
          colId,
          idx.key,
          idx.type,
          idx.attributes,
          idx.attributes.map(() => "ASC")
        );
        log(`Successfully created index: '${idx.key}'`);
      } catch (err: any) {
        if (
          err.message?.includes("already exists") ||
          err.code === 409 ||
          err.type === "index_already_exists"
        ) {
          log(`Index '${idx.key}' already exists.`);
        } else {
          log(`Notice for index '${idx.key}': ${err.message || err}`);
        }
      }
    }

    log("Schema verification and update complete!");
    return { success: true, log: logs };
  } catch (error: any) {
    log(`Fatal schema setup error: ${error.message || error}`);
    return { success: false, log: logs };
  }
}
