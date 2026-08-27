import { describe, expect, it } from "vitest";
import { blockDragPayload, blockTypeFromDragPayload } from "./drag-types";

describe("typed block drag payloads", () => {
  it("round-trips supported block types and rejects malformed values", () => {
    expect(blockDragPayload("barcode")).toBe("new:barcode");
    expect(blockTypeFromDragPayload("new:barcode")).toBe("barcode");
    expect(blockTypeFromDragPayload("new:divider")).toBeNull();
    expect(blockTypeFromDragPayload("new:spacer")).toBeNull();
    expect(blockTypeFromDragPayload("new:unknown")).toBeNull();
    expect(blockTypeFromDragPayload("new")).toBeNull();
    expect(blockTypeFromDragPayload("text:new:qr")).toBeNull();
  });
});
