export type NotificationKind =
  | "purchase_confirmed"
  | "booking_confirmed"
  | "new_order"
  | "new_ticket_sale"
  | "payment_received"
  | "booking_completed"
  | "order_completed";

export type ChannelStatus = "skipped" | "sent" | "failed";
export type NotificationPriority = "normal" | "high";
export type NotificationRefType = "order" | "ticket" | "ride" | "parcel";
export type DevicePlatform = "web" | "android" | "ios";

export type NotifyInput = {
  userId: string;
  businessId?: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
  emailBody?: string;
  speakText?: string | null;
  priority?: NotificationPriority;
  refType?: NotificationRefType | null;
  refId?: string | null;
  email?: { to: string } | null;
  sendEmail?: boolean;
};

export type DeviceToken = {
  token: string;
  userId: string;
  platform: DevicePlatform;
  appId: string;
  p256dh?: string | null;
  auth?: string | null;
};
