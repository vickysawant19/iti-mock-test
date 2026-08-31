import { tablesDb, Query } from "./appwriteClient";
import conf from "../config/config";
import { ID } from "appwrite";

interface ListRowsResponse<T> {
  total: number;
  rows: T[];
}

export class DatabaseService {
  protected databaseId: string;
  protected tableId: string;

  constructor(tableId: string, databaseId: string = conf.databaseId) {
    this.tableId = tableId;
    this.databaseId = databaseId;
  }

  /**
   * Universal Rate-Limit (429) Interceptor & Exponential Backoff Retry
   */
  protected async withRateLimitRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    maxRetries: number = 6
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const is429 =
          error?.code === 429 ||
          error?.type === "general_rate_limit_exceeded" ||
          error?.status === 429 ||
          (typeof error?.message === "string" && error.message.includes("Rate limit"));

        if (is429 && attempt < maxRetries - 1) {
          const waitMs = (attempt + 1) * 2500;
          console.warn(
            `[Appwrite 429 RateLimit Intercepted - ${operationName}] Cooling down ${waitMs / 1000}s (Attempt ${attempt + 1}/${maxRetries})...`
          );
          await new Promise((r) => setTimeout(r, waitMs));
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Rate limit exceeded after ${maxRetries} retries for ${operationName}`);
  }

  /**
   * Fetch multiple rows from a table with optimized query selection & rate limit retry
   */
  async listRows<T>(
    queries: string[] = [],
    selectFields?: string[]
  ): Promise<ListRowsResponse<T>> {
    try {
      const activeQueries = [...queries];
      if (selectFields && selectFields.length > 0) {
        activeQueries.push(Query.select(selectFields));
      }

      const response = await this.withRateLimitRetry(`listRows(${this.tableId})`, () =>
        tablesDb.listRows({
          databaseId: this.databaseId,
          tableId: this.tableId,
          queries: activeQueries
        })
      );

      const rows = (response as any).rows || (response as any).documents || [];
      const total = typeof response.total === "number" ? response.total : rows.length;

      return {
        total,
        rows,
      };
    } catch (error: any) {
      console.error(`Error in listRows (${this.tableId}):`, error);
      throw new Error(`Data fetch failed: ${error?.message}`);
    }
  }

  /**
   * Fetch a single row by its ID
   */
  async getRow<T>(
    rowId: string,
    selectFields?: string[]
  ): Promise<T> {
    try {
      const queries = selectFields && selectFields.length > 0 
        ? [Query.select(selectFields)] 
        : undefined;

      return await this.withRateLimitRetry(`getRow(${this.tableId}/${rowId})`, () =>
        tablesDb.getRow({
          databaseId: this.databaseId,
          tableId: this.tableId,
          rowId: rowId,
          queries: queries
        })
      ) as T;
    } catch (error: any) {
      console.error(`Error in getRow (${this.tableId}/${rowId}):`, error);
      throw new Error(`Data fetch failed: ${error?.message}`);
    }
  }

  /**
   * Create a new row in the table
   */
  async createRow<T>(
    data: any,
    permissions?: string[],
    customId?: string
  ): Promise<T> {
    try {
      return await this.withRateLimitRetry(`createRow(${this.tableId})`, () =>
        tablesDb.createRow({
          databaseId: this.databaseId,
          tableId: this.tableId,
          rowId: customId || ID.unique(),
          data: data,
          permissions: permissions
        })
      ) as T;
    } catch (error: any) {
      console.error(`Error creating row in ${this.tableId}:`, error);
      throw new Error(`Failed to create row: ${error?.message}`);
    }
  }

  /**
   * Update an existing row
   */
  async updateRow<T>(
    rowId: string,
    data: any,
    permissions?: string[]
  ): Promise<T> {
    try {
      return await this.withRateLimitRetry(`updateRow(${this.tableId}/${rowId})`, () =>
        tablesDb.updateRow({
          databaseId: this.databaseId,
          tableId: this.tableId,
          rowId: rowId,
          data: data,
          permissions: permissions
        })
      ) as T;
    } catch (error: any) {
      console.error(`Error updating row (${this.tableId}/${rowId}):`, error);
      throw new Error(`Failed to update row: ${error?.message}`);
    }
  }

  /**
   * Delete a row by its ID with 429 rate limit backoff retry
   */
  async deleteRow(rowId: string): Promise<boolean> {
    try {
      await this.withRateLimitRetry(`deleteRow(${this.tableId}/${rowId})`, () =>
        tablesDb.deleteRow({
          databaseId: this.databaseId,
          tableId: this.tableId,
          rowId: rowId
        })
      );
      return true;
    } catch (error: any) {
      console.error(`Error deleting row (${this.tableId}/${rowId}):`, error);
      throw new Error(`Failed to delete row: ${error?.message}`);
    }
  }
}
