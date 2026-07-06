import {
  Account,
  Client,
  Databases,
  TablesDB,
  Functions,
  Storage,
  Teams,
  Realtime,
  Presences,
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
  public presences: Presences;
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
    this.presences = new Presences(this.client);
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
  getPresences() { return this.presences; }

  // ── Appwrite SDK v26 / Server 1.9.5 notes ──────────────────────────────────
  // realtime.subscribe() is async → returns Promise<{ unsubscribe(): Promise<void>, update(options): Promise<void> }>.
  // Always await subscribe() and call sub.unsubscribe() to tear down a subscription.
  // Single persistent WebSocket per Client session.
  // Call realtime.disconnect() to close the socket connection entirely if needed.
  //
  // New in v26: Presences service (upsert/get/list/update/delete presence records).
  // BrowserTheme enum replaces the old Theme enum (avatars.getScreenshot() theme param).
  // Advisor and Usage services are admin-only and not available in client SDKs.
}

export const appwriteClientService = new AppwriteService();
export const client = appwriteClientService.client;
export const databases = appwriteClientService.databases;
export const tablesDb = appwriteClientService.tablesDb;
export const account = appwriteClientService.account;
export const storage = appwriteClientService.bucket;
export const functions = appwriteClientService.functions;
export const realtime = appwriteClientService.realtime;
export const presences = appwriteClientService.presences;
export const teams = appwriteClientService.teams;

// Re-export query for convenient use across services
export { Query };

// Export legacy alias for components that import { appwriteService }
export const appwriteService = appwriteClientService;

// Shared presence service instances using the specialized API Key for authenticated subscriptions
export const presenceClient = new Client()
  .setEndpoint(conf.appwriteUrl)
  .setProject(conf.projectId);

presenceClient.headers["X-Appwrite-Key"] =
  "standard_e623994c0ed2af791525a840dcd8979bc315e0325148247f4a35694ced2a9b55fba7c24016550a565ea718cd2de13846a051abda107fcdb90539ac29ffc136f323392cafa5501965fce7544a5ae319575f60be748d883df9d5161871357e92cb26d0634dbd36345550747c6ea222906c16e57b25ad96a6ca3aae180b8a8c0127";

export const presenceService = new Presences(presenceClient);

// Dynamically fix legacy/cloud appwrite endpoints using config Url host
export const fixProfileImage = (url: string | null | undefined): string | null | undefined => {
  if (!url) return url;
  try {
    const imgUrl = new URL(url);
    const configUrl = new URL(conf.appwriteUrl);
    imgUrl.protocol = configUrl.protocol;
    imgUrl.host = configUrl.host;
    return imgUrl.toString();
  } catch (e) {
    return url.replace("cloud.appwrite.io", "auth.itimitra.in");
  }
};
