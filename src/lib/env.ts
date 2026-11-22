// Environment for both the server and the browser, parsed once and reported
// without throwing.
//
// Every value is optional: the app falls back to fixtures when Supabase is not
// configured and to the demo customer when Clerk is not. Reads stay as full
// `process.env.NAME` expressions so Next can inline the public values at build.
// The `server-only` guard is not used because the browser client imports the
// presence helpers; secret keys are simply never read into the client bundle.

export type FlashEnv = {
  readonly siteUrl: string;
  readonly adminHost: string | null;
  readonly supportEmail: string | null;
  readonly supabaseUrl: string | null;
  readonly supabaseAnonKey: string | null;
  readonly supabaseServiceRoleKey: string | null;
  readonly clerkPublishableKey: string | null;
  readonly clerkSecretKey: string | null;
  readonly clerkWebhookSecret: string | null;
  readonly cloudinaryCloudName: string | null;
  readonly cloudinaryApiKey: string | null;
  readonly cloudinaryApiSecret: string | null;
  readonly cloudinaryFolder: string;
  readonly paystackSecretKey: string | null;
  readonly paystackPublicKey: string | null;
  readonly paystackWebhookSecret: string | null;
  readonly dispatchBaseUrl: string | null;
  readonly dispatchApiKey: string | null;
  readonly dispatchAppId: string | null;
  readonly vapidPublicKey: string | null;
  readonly vapidPrivateKey: string | null;
  readonly vapidSubject: string | null;
  readonly fcmProjectId: string | null;
  readonly fcmServiceAccountJson: string | null;
  readonly resendApiKey: string | null;
  readonly notificationsFromEmail: string | null;
};

const DEFAULT_SITE_URL = "http://localhost:3000";

function clean(value: string | undefined): string | null {
  // .env files often quote values; a quoted API key would silently fail every
  // provider check, so strip the quotes as well as the whitespace.
  const trimmed = value?.trim().replace(/^["']|["']$/g, "");
  return trimmed ? trimmed : null;
}

/**
 * The public origin, used for canonical URLs, OpenGraph and the sitemap.
 *
 * Locally this is localhost unless NEXT_PUBLIC_SITE_URL is set. On Vercel the
 * platform host is the origin when no production domain has been configured,
 * so previews get their own canonical URLs instead of claiming localhost (or
 * production) as their home.
 */
function readSiteUrl(): string {
  const configured = clean(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured.replace(/\/+$/, "");

  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? clean(process.env.VERCEL_PROJECT_PRODUCTION_URL)
      : clean(process.env.VERCEL_URL);

  return vercelHost ? `https://${vercelHost}` : DEFAULT_SITE_URL;
}

let cached: FlashEnv | null = null;

/** The parsed environment. Built once; safe to call on the server or client. */
export function getEnv(): FlashEnv {
  if (cached) return cached;

  cached = Object.freeze({
    siteUrl: readSiteUrl(),
    adminHost: clean(process.env.ADMIN_HOST),
    supportEmail: clean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
    supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    clerkPublishableKey: clean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    clerkSecretKey: clean(process.env.CLERK_SECRET_KEY),
    clerkWebhookSecret: clean(process.env.CLERK_WEBHOOK_SECRET),
    cloudinaryCloudName: clean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
    cloudinaryApiKey: clean(process.env.CLOUDINARY_API_KEY),
    cloudinaryApiSecret: clean(process.env.CLOUDINARY_API_SECRET),
    cloudinaryFolder: clean(process.env.CLOUDINARY_FOLDER) ?? "flash",
    paystackSecretKey: clean(process.env.PAYSTACK_SECRET_KEY),
    paystackPublicKey: clean(process.env.PAYSTACK_PUBLIC_KEY),
    paystackWebhookSecret: clean(process.env.PAYSTACK_WEBHOOK_SECRET),
    dispatchBaseUrl: clean(process.env.DISPATCH_BASE_URL),
    dispatchApiKey: clean(process.env.DISPATCH_API_KEY),
    dispatchAppId: clean(process.env.DISPATCH_APP_ID),
    vapidPublicKey: clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    vapidPrivateKey: clean(process.env.VAPID_PRIVATE_KEY),
    vapidSubject: clean(process.env.VAPID_SUBJECT),
    fcmProjectId: clean(process.env.FCM_PROJECT_ID),
    fcmServiceAccountJson: clean(process.env.FCM_SERVICE_ACCOUNT_JSON),
    resendApiKey: clean(process.env.RESEND_API_KEY),
    notificationsFromEmail: clean(process.env.NOTIFICATIONS_FROM_EMAIL),
  });

  return cached;
}

/** True when the browser-safe Supabase pair is present. */
export function hasSupabasePublicEnv(): boolean {
  const env = getEnv();
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/** True when the server-only Supabase admin pair is present. */
export function hasSupabaseAdminEnv(): boolean {
  const env = getEnv();
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

/** True when both halves of the Clerk pair are present. */
export function hasClerkEnv(): boolean {
  const env = getEnv();
  return Boolean(env.clerkPublishableKey && env.clerkSecretKey);
}

/** True when all three Cloudinary credentials are present. */
export function hasCloudinaryEnv(): boolean {
  const env = getEnv();
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

/** True when Paystack can take live payments. */
export function hasPaystackEnv(): boolean {
  return Boolean(getEnv().paystackSecretKey?.startsWith("sk_"));
}

/** True when Flash can post ride and parcel jobs to the shared engine. */
export function hasDispatchEnv(): boolean {
  const env = getEnv();
  return Boolean(env.dispatchBaseUrl && env.dispatchApiKey && env.dispatchAppId);
}

/** True when browser web push can be signed. */
export function hasWebPushEnv(): boolean {
  const env = getEnv();
  return Boolean(env.vapidPublicKey && env.vapidPrivateKey && env.vapidSubject);
}

/** True when native FCM push can be sent. */
export function hasFcmEnv(): boolean {
  const env = getEnv();
  return Boolean(env.fcmProjectId && env.fcmServiceAccountJson);
}

/** True when Resend can send mail. */
export function hasResendEnv(): boolean {
  const env = getEnv();
  return Boolean(env.resendApiKey && env.notificationsFromEmail);
}

/** True when at least one notification channel is configured. */
export function hasNotificationsEnv(): boolean {
  return hasWebPushEnv() || hasFcmEnv() || hasResendEnv();
}

/**
 * Actionable configuration problems. Empty when the environment is coherent.
 * Never throws: a half-configured deploy should still render the fixtures.
 */
export function envIssues(): string[] {
  const env = getEnv();
  const issues: string[] = [];

  if (env.supabaseUrl && !env.supabaseAnonKey) {
    issues.push(
      "NEXT_PUBLIC_SUPABASE_URL is set but NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
    );
  }

  if (!env.supabaseUrl && env.supabaseAnonKey) {
    issues.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is set but NEXT_PUBLIC_SUPABASE_URL is missing.",
    );
  }

  if (env.clerkPublishableKey && !env.supabaseUrl) {
    issues.push(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set but NEXT_PUBLIC_SUPABASE_URL is missing; signed-in users would have no data store.",
    );
  }

  if (typeof window === "undefined") {
    if (env.supabaseUrl && !env.supabaseServiceRoleKey) {
      issues.push(
        "NEXT_PUBLIC_SUPABASE_URL is set but SUPABASE_SERVICE_ROLE_KEY is missing — server reads fall back to fixtures.",
      );
    }

    if (!env.supabaseUrl && env.supabaseServiceRoleKey) {
      issues.push(
        "SUPABASE_SERVICE_ROLE_KEY is set but NEXT_PUBLIC_SUPABASE_URL is missing.",
      );
    }

    if (env.clerkPublishableKey && !env.clerkSecretKey) {
      issues.push(
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set but CLERK_SECRET_KEY is missing.",
      );
    }

    if (!env.clerkPublishableKey && env.clerkSecretKey) {
      issues.push(
        "CLERK_SECRET_KEY is set but NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing.",
      );
    }

    if (env.cloudinaryCloudName && !env.cloudinaryApiKey) {
      issues.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set but CLOUDINARY_API_KEY is missing.");
    }

    if (env.cloudinaryApiKey && !env.cloudinaryCloudName) {
      issues.push("CLOUDINARY_API_KEY is set but NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing.");
    }

    if (env.cloudinaryApiKey && !env.cloudinaryApiSecret) {
      issues.push("CLOUDINARY_API_KEY is set but CLOUDINARY_API_SECRET is missing.");
    }

    if (env.cloudinaryApiSecret && !env.cloudinaryApiKey) {
      issues.push("CLOUDINARY_API_SECRET is set but CLOUDINARY_API_KEY is missing.");
    }

    if (env.dispatchBaseUrl && !env.dispatchApiKey) {
      issues.push("DISPATCH_BASE_URL is set but DISPATCH_API_KEY is missing; ride and parcel jobs cannot be dispatched.");
    }

    if (env.dispatchApiKey && !env.dispatchBaseUrl) {
      issues.push("DISPATCH_API_KEY is set but DISPATCH_BASE_URL is missing.");
    }

    if ((env.dispatchApiKey || env.dispatchBaseUrl) && !env.dispatchAppId) {
      issues.push("Dispatch is configured but DISPATCH_APP_ID is missing; jobs need a tenant id.");
    }
  }

  return issues;
}
