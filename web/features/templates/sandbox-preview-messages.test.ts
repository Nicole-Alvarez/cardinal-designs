import { describe, expect, it } from "vitest";
import {
  isSandboxChildMessage,
  isSandboxParentMessage,
} from "./sandbox-preview-messages";

describe("sandbox preview message validation", () => {
  it("accepts an export request only for the active channel", () => {
    const request = {
      source: "cardinal-preview-parent",
      type: "export",
      channel: "preview-a",
      requestId: "request-a",
      target: "cards",
      pixelRatio: 2,
      allowFontFallback: false,
    };

    expect(isSandboxParentMessage(request, "preview-a")).toBe(true);
    expect(isSandboxParentMessage(request, "preview-b")).toBe(false);
  });

  it("rejects oversized or non-image export responses", () => {
    const response = {
      source: "cardinal-preview-frame",
      type: "exported",
      channel: "preview-a",
      requestId: "request-a",
      images: [
        {
          dataUrl: "https://attacker.example/collect",
          width: 400,
          height: 240,
          usedFallbackFonts: false,
        },
      ],
    };

    expect(isSandboxChildMessage(response, "preview-a")).toBe(false);
  });
});
