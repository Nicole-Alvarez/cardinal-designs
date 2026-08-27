import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CodeEditorPanel from "./code-editor-panel";

const baseProps = {
  title: "Member card",
  onLangChange: vi.fn(),
  onCodeChange: vi.fn(),
  metadata: [],
  onOpenMetadata: vi.fn(),
  onConvertToWysiwyg: vi.fn(),
};

describe("CodeEditorPanel preview isolation", () => {
  it("renders pasted HTML inside an opaque-origin sandbox", () => {
    render(
      <CodeEditorPanel
        {...baseProps}
        lang="html"
        code={'<img src="https://example.com/untrusted.png" alt="untrusted" onerror="window.parent.document.body.remove()">'}
      />
    );

    const frame = screen.getByTitle("HTML template preview");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame).not.toHaveAttribute("sandbox", expect.stringContaining("allow-same-origin"));
    expect(document.querySelector('img[alt="untrusted"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Print preview" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Download preview as PNG" })).toBeEnabled();
  });

  it("renders React code inside the same opaque-origin sandbox boundary", () => {
    render(
      <CodeEditorPanel
        {...baseProps}
        lang="react"
        code={'export default function Template() { return <div>Untrusted React</div>; }'}
      />
    );

    const frame = screen.getByTitle("React template preview");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(screen.queryByText("Untrusted React")).not.toBeInTheDocument();
  });
});
