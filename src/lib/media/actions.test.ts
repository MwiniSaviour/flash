import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  destroy: vi.fn(),
  config: vi.fn(),
  currentUserId: vi.fn(),
  createAdminClient: vi.fn(),
  hasCloudinaryEnv: true,
  cloudName: "flash-test",
  cloudinaryFolder: "flash",
}));

vi.mock("server-only", () => ({}));
vi.mock("cloudinary", () => ({
  v2: {
    config: mocks.config,
    uploader: { upload: mocks.upload, destroy: mocks.destroy },
  },
}));
vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    cloudinaryCloudName: mocks.cloudName,
    cloudinaryApiKey: "test-key",
    cloudinaryApiSecret: "test-secret",
    cloudinaryFolder: mocks.cloudinaryFolder,
  }),
  hasCloudinaryEnv: () => mocks.hasCloudinaryEnv,
}));
vi.mock("@/lib/auth/server", () => ({ currentUserId: mocks.currentUserId }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { uploadImageAction } from "./actions";
import { commitImageWrite } from "./cloudinary";
import { INCOMING_TRANSFORM } from "./transform";
import { isOwnedCloudinaryUrl } from "./url";

function file(bytes: Buffer, type = "image/jpeg"): File {
  return new File([new Uint8Array(bytes)], "photo.jpg", { type });
}

function jpegBytes(): Buffer {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
}

function form(bytes: Buffer, type?: string): FormData {
  const data = new FormData();
  data.set("file", file(bytes, type));
  return data;
}

function ownedResult(owner = "user-1", kind = "cover") {
  const publicId = `${mocks.cloudinaryFolder}/${owner}/${kind}/abc`;
  return {
    secure_url: `https://res.cloudinary.com/${mocks.cloudName}/image/upload/v123/${publicId}.webp`,
    public_id: publicId,
    bytes: 900,
    width: 1200,
    height: 800,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hasCloudinaryEnv = true;
  mocks.cloudName = "flash-test";
  mocks.cloudinaryFolder = "flash";
  mocks.currentUserId.mockResolvedValue("user-1");
  mocks.upload.mockResolvedValue(ownedResult());
  mocks.destroy.mockResolvedValue(undefined);
});

describe("uploadImageAction boundary", () => {
  it("rejects a file over 8 MB before any provider call", async () => {
    const bytes = Buffer.alloc(8 * 1024 * 1024 + 1);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    bytes[2] = 0xff;

    const result = await uploadImageAction(form(bytes), "cover");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/8 MB/);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects a byte/MIME mismatch before any provider call", async () => {
    const result = await uploadImageAction(form(Buffer.from("<svg onload=alert(1)>")), "dish");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/JPEG, PNG, WebP, AVIF or HEIC/);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("rejects missing credentials before reading the session or calling the provider", async () => {
    mocks.hasCloudinaryEnv = false;

    const result = await uploadImageAction(form(jpegBytes()), "cover");

    expect(result).toMatchObject({ ok: false, demo: true });
    expect(mocks.currentUserId).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("uploads with the exact incoming transform, webp and never f_auto", async () => {
    const result = await uploadImageAction(form(jpegBytes()), "cover");

    expect(result.ok).toBe(true);
    expect(mocks.upload).toHaveBeenCalledTimes(1);

    const [dataUri, options] = mocks.upload.mock.calls[0];
    expect(dataUri).toMatch(/^data:image\/jpeg;base64,/);
    expect(options).toMatchObject({
      folder: "flash/user-1/cover",
      resource_type: "image",
      overwrite: false,
      unique_filename: true,
    });
    expect(options.transformation).toEqual({
      crop: "limit",
      width: 2400,
      height: 2400,
      quality: "auto:good",
      fetch_format: "webp",
    });
    expect(options.transformation).toEqual(INCOMING_TRANSFORM);
    expect(JSON.stringify(options)).not.toContain("f_auto");
    expect(mocks.createAdminClient).not.toHaveBeenCalled();

    if (result.ok) {
      expect(result.data.url).toBe(ownedResult().secure_url);
      expect(result.data.publicId).toBe("flash/user-1/cover/abc");
      expect(isOwnedCloudinaryUrl(result.data.url, "user-1")).toBe(true);
    }
  });

  it("destroys and rejects an asset returned outside the signed-in uploader's folder", async () => {
    mocks.upload.mockResolvedValue(ownedResult("user-2"));

    const result = await uploadImageAction(form(jpegBytes()), "cover");

    expect(result.ok).toBe(false);
    expect(mocks.destroy).toHaveBeenCalledWith("flash/user-2/cover/abc", { invalidate: true });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });
});

describe("commitImageWrite cleanup contract", () => {
  it("destroys the previous asset after the write succeeds", async () => {
    const write = vi.fn().mockResolvedValue("written");

    await expect(
      commitImageWrite({
        newPublicId: "flash/user-1/cover/new",
        previousPublicId: "flash/user-1/cover/old",
        write,
      }),
    ).resolves.toBe("written");

    expect(write).toHaveBeenCalledTimes(1);
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
    expect(mocks.destroy).toHaveBeenCalledWith("flash/user-1/cover/old", { invalidate: true });
  });

  it("destroys the new asset when the database write fails and keeps the old one", async () => {
    const write = vi.fn().mockRejectedValue(new Error("database write failed"));

    await expect(
      commitImageWrite({
        newPublicId: "flash/user-1/cover/new",
        previousPublicId: "flash/user-1/cover/old",
        write,
      }),
    ).rejects.toThrow("database write failed");

    expect(mocks.destroy).toHaveBeenCalledTimes(1);
    expect(mocks.destroy).toHaveBeenCalledWith("flash/user-1/cover/new", { invalidate: true });
  });

  it("leaves an unchanged asset alone on replace", async () => {
    const write = vi.fn().mockResolvedValue(undefined);

    await commitImageWrite({
      newPublicId: "flash/user-1/cover/same",
      previousPublicId: "flash/user-1/cover/same",
      write,
    });

    expect(mocks.destroy).not.toHaveBeenCalled();
  });

  it("destroys the previous asset when the write replaces it with a catalogue photo", async () => {
    const write = vi.fn().mockResolvedValue(undefined);

    await commitImageWrite({
      newPublicId: null,
      previousPublicId: "flash/user-1/cover/old",
      write,
    });

    expect(mocks.destroy).toHaveBeenCalledWith("flash/user-1/cover/old", { invalidate: true });
  });

  it("never destroys the existing asset when a failed write uploaded nothing", async () => {
    const write = vi.fn().mockRejectedValue(new Error("database write failed"));

    await expect(
      commitImageWrite({
        newPublicId: "flash/user-1/cover/old",
        uploadedPublicId: null,
        previousPublicId: "flash/user-1/cover/old",
        write,
      }),
    ).rejects.toThrow("database write failed");

    expect(mocks.destroy).not.toHaveBeenCalled();
  });
});
