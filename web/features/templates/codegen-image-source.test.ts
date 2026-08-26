import { describe, expect, it } from "vitest";
import { blocksToAngular, blocksToHtml, blocksToReact } from "./codegen";
import { createUniversalBlock, DEFAULT_CANVAS } from "./types";

describe("portable image code generation", () => {
  it("preserves the public image URL in HTML, React, and Angular output", () => {
    const url = "https://assets.public.blob.vercel-storage.com/templates/card.png";
    const block = { ...createUniversalBlock(0, 0, "image"), src: url };

    expect(blocksToHtml([block], DEFAULT_CANVAS)).toContain(url);
    expect(blocksToReact([block], "Portable card", DEFAULT_CANVAS)).toContain(url);
    expect(blocksToAngular([block], "Portable card", DEFAULT_CANVAS)).toContain(url);
  });
});
