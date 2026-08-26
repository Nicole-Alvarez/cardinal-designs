import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  apiUpload: vi.fn(),
  apiUrl: vi.fn((path: string) => path),
}));

vi.mock("@/lib/api", () => api);

import { uploadBlockImage } from "./queries";

describe("template image uploads", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the permanent public URL returned by the upload API", async () => {
    api.apiUpload.mockResolvedValue({
      pathname: "templates/example.png",
      url: "https://assets.public.blob.vercel-storage.com/templates/example.png",
    });
    const file = new File(["image"], "example.png", { type: "image/png" });

    await expect(uploadBlockImage(file)).resolves.toBe(
      "https://assets.public.blob.vercel-storage.com/templates/example.png"
    );
  });

  it("rejects an upload response without a public HTTPS URL", async () => {
    api.apiUpload.mockResolvedValue({ pathname: "templates/example.png" });
    const file = new File(["image"], "example.png", { type: "image/png" });

    await expect(uploadBlockImage(file)).rejects.toThrow(
      "Upload did not return a portable image URL"
    );
  });
});
