import { account, functions } from "./appwriteClient";

export interface CreateAccountPayload {
  email: string;
  password?: string;
  name?: string;
  labels?: string[];
  countryCode?: string;
  phone?: string;
}

export class AuthService {
  async createAccount(payload: CreateAccountPayload) {
    try {
      const response = await functions.createExecution(
        "678e7277002e1d5c9b9b",
        JSON.stringify({
          ...payload,
          action: "createAccount",
        })
      );
      const result = JSON.parse(response.responseBody);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  async login({ email, password }: { email: string; password?: string }) {
    try {
      if (!password) {
        throw new Error("Password is required for email login.");
      }
      await account.createEmailPasswordSession(email, password);
      return await this.getCurrentUser();
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCurrentUser() {
    try {
      const res = await account.get();
      return res;
    } catch (error) {
      // Don't throw for get user, just return null so UI knows user is logged out
      return null;
    }
  }

  async logout() {
    try {
      return await account.deleteSession("current");
    } catch (error) {
      this.handleError(error);
    }
  }

  async forgotPassword(email: string) {
    try {
      const redirectUrl =
        process.env.NODE_ENV === "production"
          ? "https://itimocktest.vercel.app/reset-pass"
          : "http://localhost:5173/reset-pass";
      const res = await account.createRecovery(email, redirectUrl);
      return res;
    } catch (error) {
      this.handleError(error);
    }
  }

  async resetPassword(userId: string, secret: string, password?: string) {
    try {
      if (!password) throw new Error("A new password is required.");
      const res = await account.updateRecovery(userId, secret, password);
      return res;
    } catch (error) {
      this.handleError(error);
    }
  }

  async changePassword(oldPassword?: string, newPassword?: string) {
    try {
      if (!oldPassword || !newPassword) {
         throw new Error("Both old and new passwords are required.");
      }
      const res = await account.updatePassword(newPassword, oldPassword);
      return res;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any) {
    if (error instanceof Error) {
      throw new Error(`${error.message.split(".")[0]}`);
    }
    throw error;
  }
}

export const authService = new AuthService();
export default authService;
