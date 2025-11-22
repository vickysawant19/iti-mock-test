import {
  Account,
  Client,
  Databases,
  Functions,
  Storage,
  Teams,
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
}

const appwriteService = new AppwriteService();

export { appwriteService };
