import {
  Account,
  Client,
  Databases,
  TablesDB,
  Functions,
  Storage,
  Teams,
  Realtime,
  Query,
} from "appwrite";
import conf from "../config/config";

// Ensure conf variables exist
if (!conf.appwriteUrl || !conf.projectId) {
  throw new Error("Missing Appwrite configuration. Check your environment variables.");
}

class AppwriteService {
  public client: Client;
  public databases: Databases;
  public tablesDb: TablesDB;
  public account: Account;
  public bucket: Storage;
  public functions: Functions;
  public realtime: Realtime;
  public teams: Teams;

  constructor() {
    this.client = new Client()
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.projectId);

    // Legacy Document-based API
    this.databases = new Databases(this.client);
    
    // New Relational API
    this.tablesDb = new TablesDB(this.client);
    
    // Monkeypatch listRows to inject legacy 'documents' property so UI doesn't break
    const originalListRows = this.tablesDb.listRows.bind(this.tablesDb);
    this.tablesDb.listRows = async (...args: any[]) => {
      const response = await originalListRows(...args);
      if (response && response.rows) {
        (response as any).documents = response.rows; // Keep UI happy
      }
      return response;
    };
    
    this.account = new Account(this.client);
    this.bucket = new Storage(this.client);
    this.functions = new Functions(this.client);
    this.realtime = new Realtime(this.client);
    this.teams = new Teams(this.client);
  }

  // Backwards compatibility with appwriteConfig.js 
  getClient() { return this.client; }
  getDatabases() { return this.databases; } // Fallback if still needed
  getTablesDB() { return this.tablesDb; }
  getAccount() { return this.account; }
  getStorage() { return this.bucket; }
  getFunctions() { return this.functions; }
  getRealtime() { return this.realtime; }
}

export const appwriteClientService = new AppwriteService();
export const client = appwriteClientService.client;
export const databases = appwriteClientService.databases;
export const tablesDb = appwriteClientService.tablesDb;
export const account = appwriteClientService.account;
export const storage = appwriteClientService.bucket;
export const functions = appwriteClientService.functions;
export const realtime = appwriteClientService.realtime;
export const teams = appwriteClientService.teams;

// Re-export query for convenient use across services
export { Query };

// Export legacy alias for components that import { appwriteService }
export const appwriteService = appwriteClientService;
