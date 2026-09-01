import { describe, expect, it } from "vitest";
import { validateReferenceImage } from "./reference-image.service";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL3VQAAAABJRU5ErkJggg==", "base64");

describe("validateReferenceImage", () => {
  it("accepts a small PNG and produces a transient data URI", () => {
    const image = validateReferenceImage({ buffer: png, mimetype: "image/png", originalname: "card.png" });
    expect(image).toMatchObject({ mimeType: "image/png", width: 1, height: 1 });
    expect(image.dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("rejects mismatched extensions and invalid bytes", () => {
    expect(() => validateReferenceImage({ buffer: png, mimetype: "image/png", originalname: "card.jpg" })).toThrow("extension");
    expect(() => validateReferenceImage({ buffer: png, mimetype: "image/jpeg", originalname: "card.jpg" })).toThrow("type");
    expect(() => validateReferenceImage({ buffer: Buffer.from("not an image"), mimetype: "image/png", originalname: "card.png" })).toThrow("invalid");
  });
});
