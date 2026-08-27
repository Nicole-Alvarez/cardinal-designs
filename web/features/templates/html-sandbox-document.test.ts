import { describe, expect, it } from "vitest";
import { buildHtmlSandboxDocument } from "./html-sandbox-document";

describe("buildHtmlSandboxDocument", () => {
  it("encodes pasted HTML and resolves one preview card per data record", () => {
    const source = '<div data-card>{{fullname}} — {{memberId}}</div>';

    const document = buildHtmlSandboxDocument(source, [
      { fullname: "Nicole Alvarez", memberId: "M-001" },
      { fullname: "Sam Lee", memberId: "M-002" },
    ]);

    expect(document).not.toContain(source);
    expect(document).not.toContain("Nicole Alvarez");
    expect(document).toContain("data-preview-payload=");

    const encoded = document.match(/data-preview-payload="([^"]+)"/)?.[1];
    expect(encoded).toBeTruthy();
    const payload = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(atob(encoded!), (character) => character.charCodeAt(0)))
    );
    expect(payload).toEqual({
      mode: "html",
      cards: [
        '<div data-card>Nicole Alvarez — M-001</div>',
        '<div data-card>Sam Lee — M-002</div>',
      ],
    });
  });

  it("keeps source scripts inert by storing all pasted code in encoded data", () => {
    const source = '</script><script>window.parent.document.body.remove()</script>';

    const document = buildHtmlSandboxDocument(source, []);

    expect(document).not.toContain(source);
    expect(document.match(/<script/g)).toHaveLength(1);
    expect(document).toContain("querySelectorAll(\"script,iframe,object,embed,base\")");
  });

  it("preserves the parent message channel through HTML attribute encoding", () => {
    const channel = ':preview&"one"';
    const document = buildHtmlSandboxDocument("<div>Card</div>", [], channel);
    const parsed = new DOMParser().parseFromString(document, "text/html");

    expect(parsed.body.dataset.previewChannel).toBe(channel);
  });
});
