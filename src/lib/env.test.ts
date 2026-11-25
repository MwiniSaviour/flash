import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assertProductionEnv, resetEnvCache } from "./env";

const REQUIRED = [
  "DATABASE_API_URL",
  "DATABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

function stubAll(): void {
  for (const key of REQUIRED) vi.stubEnv(key, "value");
  resetEnvCache();
}

describe("assertProductionEnv", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
  });

  it("does not throw when every key is present", () => {
    stubAll();
    expect(() => assertProductionEnv()).not.toThrow();
  });

  it("lists one missing key", () => {
    stubAll();
    vi.stubEnv("DATABASE_SERVICE_ROLE_KEY", "");
    resetEnvCache();
    expect(() => assertProductionEnv()).toThrow(
      "Flash is not configured: DATABASE_SERVICE_ROLE_KEY",
    );
  });

  it("lists every missing key in declaration order", () => {
    for (const key of REQUIRED) vi.stubEnv(key, "");
    resetEnvCache();
    expect(() => assertProductionEnv()).toThrow(
      `Flash is not configured: ${REQUIRED.join(", ")}`,
    );
  });

  it("accepts the non-prefixed Cloudinary cloud name alias", () => {
    stubAll();
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "flash");
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "");
    resetEnvCache();
    expect(() => assertProductionEnv()).not.toThrow();
  });
});
