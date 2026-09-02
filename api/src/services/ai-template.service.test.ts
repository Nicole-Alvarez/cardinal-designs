import { afterEach, describe, expect, it, vi } from "vitest";
import { config } from "../config";
import { AI_LAYOUT_RESPONSE_SCHEMA, createAiLayout, normalizeAiLayout, openAiErrorDetails, retryAfterSeconds } from "./ai-template.service";

const canvas = {
  width: "505px",
  height: "319px",
  backgroundColor: "#ffffff",
  textColor: "#000000",
  overlayImage: "",
  overlayFit: "cover" as const,
  overlayOpacity: 60,
  overlayMargin: 0,
  overlayPadding: 0,
  borderWidth: 0,
  borderColor: "#e4e4e7",
  borderRadius: 0,
};

const originalOpenAiApiKey = config.openAiApiKey;

afterEach(() => {
  config.openAiApiKey = originalOpenAiApiKey;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function responseWithLayout() {
  return new Response(JSON.stringify({
    id: "resp_layout",
    status: "completed",
    output: [{
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify({ blocks: [] }) }],
    }],
  }), { status: 200 });
}

describe("normalizeAiLayout", () => {
  it("creates editable, in-bounds blocks with server-generated IDs", () => {
    const result = normalizeAiLayout(canvas, {
      blocks: [
        {
          type: "heading",
          x: -20,
          y: 280,
          width: 700,
          height: 80,
          text: "Welcome",
          style: { fontSize: 28, color: "#112233" },
        },
      ],
    });

    expect(result.canvas).toEqual(canvas);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({
      type: "heading",
      x: 0,
      y: 239,
      width: 505,
      height: 80,
      z: 0,
      text: "Welcome",
      style: expect.objectContaining({ fontSize: 28, color: "#112233" }),
    });
    expect(result.blocks[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("creates an upload-ready image block instead of inventing an asset URL", () => {
    const result = normalizeAiLayout(canvas, {
      blocks: [{ type: "image", x: 10, y: 12, width: 200, height: 100, alt: "Member portrait" }],
    });

    expect(result.blocks[0]).toMatchObject({
      type: "image",
      src: "",
      alt: "Member portrait",
    });
  });

  it("applies only safe AI canvas colors while preserving the configured dimensions and overlays", () => {
    const result = normalizeAiLayout(canvas, {
      canvas: {
        backgroundColor: "#123456",
        textColor: "#fefefe",
        borderWidth: 3,
        borderColor: "#fedcba",
        borderRadius: 18,
        width: "999px",
        overlayImage: "https://untrusted.example/image.png",
      },
      blocks: [],
    });

    expect(result.canvas).toMatchObject({
      width: canvas.width,
      height: canvas.height,
      overlayImage: canvas.overlayImage,
      backgroundColor: "#123456",
      textColor: "#fefefe",
      borderWidth: 3,
      borderColor: "#fedcba",
      borderRadius: 18,
    });
  });

  it("rejects unsupported block types and unbounded payloads", () => {
    expect(() => normalizeAiLayout(canvas, { blocks: [{ type: "script" }] })).toThrow(
      "unsupported block type"
    );
    expect(() => normalizeAiLayout(canvas, { blocks: Array.from({ length: 26 }, () => ({ type: "text" })) })).toThrow(
      "25 blocks"
    );
    expect(() => normalizeAiLayout(canvas, { blocks: Array.from({ length: 4 }, () => ({ type: "image" })) })).toThrow(
      "3 image blocks"
    );
  });

  it("allows up to 25 blocks when the layout has no image blocks", () => {
    const result = normalizeAiLayout(canvas, {
      blocks: Array.from({ length: 25 }, () => ({ type: "text" })),
    });

    expect(result.blocks).toHaveLength(25);
  });

  it("allows image layouts until the universal 25-block limit", () => {
    expect(normalizeAiLayout(canvas, {
      blocks: [{ type: "image" }, ...Array.from({ length: 24 }, () => ({ type: "text" }))],
    }).blocks).toHaveLength(25);
  });
});

describe("openAiErrorDetails", () => {
  it("keeps actionable provider details for server logs without request content", () => {
    expect(openAiErrorDetails("/responses", new Response(null, {
      status: 400,
      headers: { "x-request-id": "req_123" },
    }), {
      error: { message: "Invalid schema", type: "invalid_request_error", code: "invalid_json_schema" },
    })).toEqual({
      endpoint: "/responses",
      status: 400,
      requestId: "req_123",
      type: "invalid_request_error",
      code: "invalid_json_schema",
      message: "Invalid schema",
    });
  });
});

describe("OpenAI rate-limit and schema safeguards", () => {
  it("uses a bounded Retry-After value", () => {
    expect(retryAfterSeconds(new Response(null, { headers: { "retry-after": "12" } }))).toBe(12);
    expect(retryAfterSeconds(new Response(null, { headers: { "retry-after": "999" } }))).toBeNull();
  });

  it("fully constrains the strict response style object", () => {
    const style = AI_LAYOUT_RESPONSE_SCHEMA.properties.blocks.items.properties.style;
    expect(style.additionalProperties).toBe(false);
    expect(style.required).toContain("fontSize");
    expect(AI_LAYOUT_RESPONSE_SCHEMA.properties.blocks.maxItems).toBe(25);
  });
});

describe("createAiLayout", () => {
  it("uses the unified trusted prompt with the original request last", async () => {
    config.openAiApiKey = "test-key";
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [{ flagged: false }] }), { status: 200 }))
      .mockResolvedValueOnce(responseWithLayout());
    vi.stubGlobal("fetch", fetch);

    await createAiLayout("Keep every decorative detail", canvas);

    const request = JSON.parse(fetch.mock.calls[1][1].body as string);
    expect(request.input).toHaveLength(2);
    expect(request.input[0].content).toContain("[SYSTEM PRE-PROMPT]\nYou are a designer.");
    expect(request.input[0].content).not.toContain("Keep every decorative detail");
    expect(request.input[1]).toEqual({ role: "user", content: "[USER REQUEST]\nKeep every decorative detail" });
  });
});
