import {
  Language,
  SubscriptionStatus,
} from '../modules/auth/schemas/user.schema';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      language: Language;
      timezone?: string;
      currency?: string;
      balance?: number;
      subscriptionStatus: SubscriptionStatus;
      trialEndsAt: Date;
      subscriptionExpiresAt?: Date;
    }
  }
}

export {};
