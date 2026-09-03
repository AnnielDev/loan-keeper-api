// Shape of a Google Cloud Pub/Sub push message, used to deliver Google Play
// Real-time Developer Notifications (RTDN). Left as a plain interface (not a
// class-validator DTO) since it's an external payload we only partially read.
export interface GooglePubSubPushMessage {
  message?: {
    data?: string;
    messageId?: string;
    publishTime?: string;
  };
  subscription?: string;
}

// Decoded (base64) contents of `message.data` for a subscription event.
// https://developer.android.com/google/play/billing/rtdn-reference
export interface GoogleDeveloperNotification {
  subscriptionNotification?: {
    purchaseToken: string;
    subscriptionId: string;
    notificationType: number;
  };
}
