import { describe, expect, it } from "vitest";
import { classifyImageSource } from "./image-source";

describe("image source portability", () => {
  it.each([
    ["https://assets.public.blob.vercel-storage.com/templates/card.png", "portable"],
    ["https://images.example.com/card.png", "portable"],
    ["data:image/png;base64,aW1hZ2U=", "portable"],
    ["/api/uploads/blob?pathname=templates/legacy.png", "project-only"],
    ["https://assets.private.blob.vercel-storage.com/templates/card.png", "project-only"],
    ["blob:https://cardinal.example/123", "temporary"],
    ["javascript:alert(1)", "invalid"],
    ["", "empty"],
  ] as const)("classifies %s as %s", (source, expected) => {
    expect(classifyImageSource(source)).toBe(expected);
  });
});
