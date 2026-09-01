import { describe, expect, it } from "vitest";
import { createTemplateZipManifest } from "./template-zip-export";
import { DEFAULT_CANVAS, type TemplateContent } from "./types";

const content = (blocks: TemplateContent["blocks"]): TemplateContent => ({
  version: 4, canvas: DEFAULT_CANVAS, blocks, metadata: [],
});

describe("createTemplateZipManifest", () => {
  it("creates deterministic canvas folders and z-ordered layer files", () => {
    const manifest = createTemplateZipManifest("Member Card", [
      { id: "back", title: "Front", position: 1, content: content([{ id: "b", type: "qr", x: 0, y: 0, width: 20, height: 20, z: 2, text: "x", style: { color: "inherit", backgroundColor: "transparent", fontSize: 16, fontWeight: 400, textAlign: "left", padding: 0, borderWidth: 0, borderColor: "#000", borderRadius: 0 } }]) },
      { id: "front", title: "Front", position: 0, content: content([{ id: "a", type: "text", x: 0, y: 0, width: 20, height: 20, z: 1, text: "Name", style: { color: "inherit", backgroundColor: "transparent", fontSize: 16, fontWeight: 400, textAlign: "left", padding: 0, borderWidth: 0, borderColor: "#000", borderRadius: 0 } }]) },
    ]);

    expect(manifest.zipFileName).toBe("member-card.zip");
    expect(manifest.items.map((item) => item.path)).toEqual([
      "01-front/00-canvas.png",
      "01-front/01-name.png",
      "02-front/00-canvas.png",
      "02-front/01-qr.png",
    ]);
  });
});
