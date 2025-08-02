
import { appwriteService } from "./appwriteConfig";
import { ID } from "appwrite";

export class AuthService {
  constructor() {
    this.client = appwriteService.getClient();
    this.account = appwriteService.getAccount();
    this.functions = appwriteService.getFunctions()
  }

  async createAccount({ email, password, name, labels, phone }) {
    try {
      const response = await this.functions.createExecution("678e7277002e1d5c9b9b", JSON.stringify({email, password, name, labels, phone, action: "createAccount" }))
      const result = JSON.parse(response.responseBody)
      return result
    } catch (error) {
      this.handleError(error);
    }
  }

  async login({ email, password }) {
    try {
      await this.account.createEmailPasswordSession(email, password);
      return await this.getCurrentUser();
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCurrentUser() {
    try {
      return await this.account.get();
    } catch (error) {
      this.handleError(error);
    }
  }

  async logout() {
    try {
      return await this.account.deleteSession("current");
    } catch (error) {
      this.handleError(error);
    }
  }

  async forgotPassword(email) {
    try {
      const redirectUrl =
        process.env.NODE_ENV === "production"
          ? "https://itimocktest.vercel.app/reset-pass"
          : "http://localhost:5173/reset-pass";
      const res = await this.account.createRecovery(email, redirectUrl);
      return res;
    } catch (error) {
      this.handleError(error);
    }
  }

  async resetPassword(userId, secret, password) {
    try {
      const res = await this.account.updateRecovery(userId, secret, password);
      return res;
    } catch (error) {
      this.handleError(error);
    }
  }

  async changePassword(oldPassword, newPassword) {
    try {
      const res = await this.account.updatePassword(newPassword, oldPassword);
      return res;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    throw new Error(`${error.message.split(".")[0]}`);
  }
}

const authService = new AuthService();
export default authService;
