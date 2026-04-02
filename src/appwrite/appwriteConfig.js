import {
  Account,
  Client,
  Databases,
  Functions,
  Storage,
  Teams,
  Realtime,
  Query,
} from "appwrite";
import conf from "../config/config";

class AppwriteService {
  constructor() {
    this.client = new Client();

    this.client
      .setEndpoint(conf.appwriteUrl) // Your Appwrite Endpoint
      .setProject(conf.projectId); // Your project ID

    this.databases = new Databases(this.client);
    this.account = new Account(this.client);
    this.bucket = new Storage(this.client);
    this.functions = new Functions(this.client);
    this.realtime = new Realtime(this.client);
  }

  getClient() {
    return this.client;
  }

  getDatabases() {
    return this.databases;
  }

  getAccount() {
    return this.account;
  }

  getStorage() {
    return this.bucket;
  }
  getFunctions() {
    return this.functions;
  }
  getRealtime() {
    return this.realtime;
  }

  async getAllDocumentsPaginated(
    collectionId,
    queries = [],
    limit = 100,
    offset = 0
  ) {
    try {
      const response = await this.databases.listDocuments(
        conf.databaseId,
        collectionId,
        [...queries, Query.limit(limit), Query.offset(offset)]
      );

      return {
        documents: response.documents,
        total: response.total,
      };
    } catch (error) {
      console.error("Pagination Fetch Error:", error);
      throw error;
    }
  }
}

const appwriteService = new AppwriteService();

export { appwriteService };
