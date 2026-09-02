import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  apiUpload: vi.fn(),
  apiUrl: vi.fn((path: string) => path),
}));

vi.mock("@/lib/api", () => api);

import { createAiLayout, uploadBlockImage } from "./queries";
import { DEFAULT_CANVAS } from "./types";

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

describe("AI layout requests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the prompt and canvas without a generation mode", async () => {
    api.apiFetch.mockResolvedValue({ content: { version: 4, canvas: DEFAULT_CANVAS, metadata: [], blocks: [] } });

    await createAiLayout("A gold card", DEFAULT_CANVAS);

    expect(JSON.parse(api.apiFetch.mock.calls[0][1].body)).toMatchObject({
      prompt: "A gold card",
      canvas: DEFAULT_CANVAS,
    });
  });
});
