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
   * Fetch multiple rows from a table with optimized query selection
   */
  async listRows<T>(
    queries: string[] = [],
    selectFields?: string[]
  ): Promise<ListRowsResponse<T>> {
    try {
      if (selectFields && selectFields.length > 0) {
        queries.push(Query.select(selectFields));
      }

      const response = await tablesDb.listRows(
        this.databaseId,
        this.tableId,
        queries
      );

      return {
        total: response.total,
        // Map the new signature, Appwrite uses `rows` in TablesDB response, 
        // fallback to documents if SDK returned something mixed
        rows: (response as any).rows || (response as any).documents,
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
        : [];

      return await tablesDb.getRow(
        this.databaseId,
        this.tableId,
        rowId,
        queries
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
      return await tablesDb.createRow(
        this.databaseId,
        this.tableId,
        customId || ID.unique(),
        data,
        permissions
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
      return await tablesDb.updateRow(
        this.databaseId,
        this.tableId,
        rowId,
        data,
        permissions
      ) as T;
    } catch (error: any) {
      console.error(`Error updating row (${this.tableId}/${rowId}):`, error);
      throw new Error(`Failed to update row: ${error?.message}`);
    }
  }

  /**
   * Delete a row by its ID
   */
  async deleteRow(rowId: string): Promise<boolean> {
    try {
      await tablesDb.deleteRow(
        this.databaseId,
        this.tableId,
        rowId
      );
      return true;
    } catch (error: any) {
      console.error(`Error deleting row (${this.tableId}/${rowId}):`, error);
      throw new Error(`Failed to delete row: ${error?.message}`);
    }
  }
}
