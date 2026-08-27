import { describe, expect, it } from "vitest";
import { buildReactSandboxDocument } from "./react-sandbox-document";

const SAMPLE_COMPONENT = `
interface GigiPointsProps {
  fullname: string;
  memberId: string;
}

export default function GigiPoints({ fullname, memberId }: GigiPointsProps) {
  return (
    <div style={{ position: "relative", width: "505px", height: "319px", backgroundColor: "#122C52" }}>
      <svg viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="2" /></svg>
      <p>{fullname}</p>
      <p>{memberId}</p>
      <img src="data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E" alt="QR code" />
    </div>
  );
}
`;

function sandboxPayload(document: string): Record<string, unknown> {
  const parsed = new DOMParser().parseFromString(document, "text/html");
  const encoded = parsed.body.dataset.previewPayload;
  if (!encoded) throw new Error("Sandbox payload missing.");
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
}

describe("buildReactSandboxDocument", () => {
  it("compiles a generated TSX card without executing it in the parent document", async () => {
    const document = await buildReactSandboxDocument(
      SAMPLE_COMPONENT,
      [{ fullname: "Nicole Alvarez", memberId: "M-001" }],
      "react-preview"
    );

    expect(document).not.toContain(SAMPLE_COMPONENT);
    expect(document).not.toContain("Nicole Alvarez");
    expect(sandboxPayload(document)).toMatchObject({
      mode: "react",
      records: [{ fullname: "Nicole Alvarez", memberId: "M-001" }],
    });
    expect(String(sandboxPayload(document).compiledCode)).toContain("React.createElement");
  });

  it("keeps missing props visible as reusable placeholders", async () => {
    const document = await buildReactSandboxDocument(SAMPLE_COMPONENT, [], "react-preview");

    expect(sandboxPayload(document)).toMatchObject({
      records: [{ fullname: "{fullname}", memberId: "{memberId}" }],
    });
  });

  it("reports invalid TSX during compilation", async () => {
    await expect(
      buildReactSandboxDocument("export default function Broken( {", [], "react-preview")
    ).rejects.toThrow();
  });
});
