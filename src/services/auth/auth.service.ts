import { account, functions, realtime } from "../core/appwriteClient";
import conf from "../../config/config";

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
      const response = await functions.createExecution({
        functionId: conf.userManageFunctionId,
        body: JSON.stringify({
          ...payload,
          action: "createAccount",
        })
      });
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
      if (typeof window !== "undefined" && window.localStorage) {
        const theme = localStorage.getItem("app-theme");
        localStorage.clear();
        if (theme) {
          localStorage.setItem("app-theme", theme);
        }
      }
      const session = await account.createEmailPasswordSession(email, password);
      const user = await this.getCurrentUser();
      if (!user) {
        // Fallback: If getCurrentUser fails right after login, use the session's userId
        return { $id: session.userId, email: email };
      }
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCurrentUser() {
    try {
      const res = await account.get();
      if (res && !res.$id) {
         console.warn("[DEBUG] getCurrentUser received an invalid user object without an $id:", res);
         return null;
      }
      return res;
    } catch (error) {
      // Don't throw for get user, just return null so UI knows user is logged out
      return null;
    }
  }

  async logout() {
    try {
      try {
        await realtime.disconnect();
      } catch (err) {
        console.warn("Failed to disconnect realtime WebSocket:", err);
      }
      if (typeof window !== "undefined" && window.localStorage) {
        const theme = localStorage.getItem("app-theme");
        localStorage.clear();
        if (theme) {
          localStorage.setItem("app-theme", theme);
        }
      }
      return await account.deleteSession("current");
    } catch (error) {
      this.handleError(error);
    }
  }

  async forgotPassword(email: string) {
    try {
      const redirectUrl =
        process.env.NODE_ENV === "production"
          ? "https://itimitra.in/reset-pass"
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

  async adminResetPassword(userId: string, password?: string) {
    try {
      if (!password) throw new Error("A new password is required.");
      const response = await functions.createExecution({
        functionId: conf.userManageFunctionId,
        body: JSON.stringify({
          action: "updatePassword",
          userId,
          password
        })
      });
      const result = JSON.parse(response.responseBody);
      if (!result.success) {
        throw new Error(result.error || "Failed to reset student password");
      }
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateName(name?: string) {
    try {
      if (!name) throw new Error("Name cannot be empty.");
      const res = await account.updateName(name);
      return res;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any) {
    console.error("AuthService Error:", error);
    let message = "An error occurred with authentication.";

    if (error && typeof error === "object") {
      if (error.code === 401) {
        message = "Invalid email or password.";
      } else if (error.code === 409) {
        message = "An account with this email already exists.";
      } else if (error.message) {
        message = error.message;
      }
    }

    throw new Error(message);
  }
}

export const authService = new AuthService();
export default authService;
