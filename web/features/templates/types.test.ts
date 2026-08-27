import { describe, expect, it } from "vitest";
import { parseContent } from "./types";

describe("parseContent legacy blocks", () => {
  it("keeps saved spacer blocks readable after removing their creation UI", () => {
    const content = parseContent({
      blocks: [
        {
          id: "legacy-spacer",
          type: "spacer",
          x: 12,
          y: 20,
          width: 280,
          height: 44,
          z: 1,
          style: {},
        },
      ],
    });

    expect(content.blocks[0]).toMatchObject({
      id: "legacy-spacer",
      type: "spacer",
      width: 280,
      height: 44,
    });
  });
});
