import { describe, expect, it } from "vitest";
import { FONT_OPTIONS } from "./fonts";

describe("FONT_OPTIONS", () => {
  it("includes a monospace option for text blocks", () => {
    const mono = FONT_OPTIONS.filter((f) => f.stack.includes("monospace"));
    expect(mono.length).toBeGreaterThan(0);
  });
});
