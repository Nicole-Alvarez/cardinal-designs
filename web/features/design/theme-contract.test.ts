import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("application theme", () => {
  it("defines the semantic black, white, and gold contract", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
    for (const token of [
      "--app-bg",
      "--surface-1",
      "--surface-2",
      "--surface-3",
      "--text-primary",
      "--text-secondary",
      "--text-muted",
      "--border-subtle",
      "--accent",
      "--accent-hover",
      "--accent-active",
      "--accent-soft",
      "--accent-foreground",
      "--focus",
    ])
      expect(css).toContain(token);
    expect(css).not.toContain("#7c3aed");
  });
});
