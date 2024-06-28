import { appwriteService } from './appwriteConfig';
import { ID } from 'appwrite';

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
      throw new Error(`${error.message.split(".")[0]}`);
    }
  }

  async login({ email, password }) {
    try {
      await this.account.createEmailPasswordSession(email, password);
      return await this.getCurrentUser();
    } catch (error) {
      console.log(error);
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
      return await this.account.deleteSession('current');
    } catch (error) {
      throw new Error(error);
    }
  }
}

const authService = new AuthService();
export default authService;
