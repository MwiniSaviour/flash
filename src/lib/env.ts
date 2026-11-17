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
};

const DEFAULT_SITE_URL = "http://localhost:3000";

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readSiteUrl(): string {
  const configured = clean(process.env.NEXT_PUBLIC_SITE_URL);
  return configured ? configured.replace(/\/+$/, "") : DEFAULT_SITE_URL;
}

let cached: FlashEnv | null = null;

/** The parsed environment. Built once; safe to call on the server or client. */
export function getEnv(): FlashEnv {
  if (cached) return cached;

  cached = Object.freeze({
    siteUrl: readSiteUrl(),
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
  }

  return issues;
}
