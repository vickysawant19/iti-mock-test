import conf from "../config/conf";

import { Client, Account, ID } from "appwrite";

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
        //call another method
        console.log("here with ", userAccount);
        return await this.login({ email, password });
      }
    } catch (error) {
      throw new Error(`${error.message.split(".")[0]}`);
    }
  }

  async login({ email, password }) {
    try {
      await this.account.createEmailSession(email, password);
      return await this.getCurrentUser();
    } catch (error) {
      throw new Error(`${error.message.split(".")[0]}`);
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