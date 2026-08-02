import { Language } from '../modules/auth/schemas/user.schema';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      language: Language;
    }
  }
}

export {};
