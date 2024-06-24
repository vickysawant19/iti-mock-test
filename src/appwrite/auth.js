

import { Client, Account, ID } from "appwrite";
import conf from "../config/config";

export class AuthService {
  client = new Client();
  account;

  constructor() {
    this.client.setEndpoint(conf.appwriteUrl).setProject(conf.projectId);
    this.account = new Account(this.client);
  }

  async createAccount({ email, password, name }) {
    try {
      const userAccount = await this.account.create(
        ID.unique(),
        email,
        password,
        name
      );
      if (userAccount) {
        return await this.login({ email, password });
      }
    } catch (error) {
      throw new Error(`${error.message.split(".")[0]}`);
    }
  }

  async login({ email, password }) {
    try {
      // await this.account.createEmailSession(email, password);
      await this.account.createEmailPasswordSession(email, password);
      return await this.getCurrentUser();
    } catch (error) {
      console.log(error);
      throw new Error(`${error.message.split(".")[0]}`);
      // throw new Error(`login error`);
    }
  }

  async getCurrentUser() {
    try {
      const user = await this.account.get();
      return user;
    } catch (error) {
      throw new Error(`${error.message.split(".")[0]}`);
    }
  }

  async logout() {
    try {
      return await this.account.deleteSession("current");
    } catch (error) {
      throw new Error(error);
    }
  }
}

const authService = new AuthService();
export default authService;