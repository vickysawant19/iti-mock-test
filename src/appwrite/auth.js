import { appwriteService } from "./appwriteConfig";
import { ID } from "appwrite";

export class AuthService {
  constructor() {
    this.client = appwriteService.getClient();
    this.account = appwriteService.getAccount();
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

      console.log("redirect url", redirectUrl);
      const res = await this.account.createRecovery(email, redirectUrl);
      console.log(res);
    } catch (error) {
      this.handleError(error);
    }
  }

  async resetPassword(userId, secret, password) {
    try {
      const res = await this.account.updateRecovery(userId, secret, password);
      console.log(res);
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
