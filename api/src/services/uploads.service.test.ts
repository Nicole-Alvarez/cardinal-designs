import { beforeEach, describe, expect, it, vi } from "vitest";

const blob = vi.hoisted(() => ({
  put: vi.fn(),
  get: vi.fn(),
}));
const appConfig = vi.hoisted(() => ({
  blobToken: "private-token",
  publicBlobToken: "public-token",
}));

vi.mock("@vercel/blob", () => blob);
vi.mock("../config", () => ({ config: appConfig }));

import { putImage } from "./uploads.service";

describe("public template image uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appConfig.publicBlobToken = "public-token";
  });

  it("uploads with public access and returns the permanent public URL", async () => {
    blob.put.mockResolvedValue({
      pathname: "templates/example.png",
      url: "https://assets.public.blob.vercel-storage.com/templates/example.png",
    });

    const uploaded = await putImage(Buffer.from("image"), "image/png");

    expect(blob.put).toHaveBeenCalledWith(
      expect.stringMatching(/^templates\/[0-9a-f-]+\.png$/),
      expect.any(Buffer),
      {
        access: "public",
        addRandomSuffix: true,
        contentType: "image/png",
        token: "public-token",
      }
    );
    expect(uploaded).toEqual({
      pathname: "templates/example.png",
      url: "https://assets.public.blob.vercel-storage.com/templates/example.png",
      contentType: "image/png",
    });
  });

  it("fails clearly when the public Blob store is not configured", async () => {
    appConfig.publicBlobToken = "";

    await expect(putImage(Buffer.from("image"), "image/png")).rejects.toMatchObject({
      message: "PUBLIC_BLOB_READ_WRITE_TOKEN is not configured",
      statusCode: 500,
    });
    expect(blob.put).not.toHaveBeenCalled();
  });
});
