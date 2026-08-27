import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CodeEditorPanel from "./code-editor-panel";

const baseProps = {
  title: "Member card",
  onLangChange: vi.fn(),
  onCodeChange: vi.fn(),
  metadata: [],
  onOpenMetadata: vi.fn(),
  onConvertToWysiwyg: vi.fn(),
};

afterEach(() => vi.useRealTimers());

describe("CodeEditorPanel preview isolation", () => {
  it("renders pasted HTML inside an opaque-origin sandbox", () => {
    render(
      <CodeEditorPanel
        {...baseProps}
        lang="html"
        code={
          '<section data-untrusted-preview><img src="https://example.com/untrusted.png" alt="untrusted" onerror="window.parent.document.body.remove()"></section>'
        }
      />
    );

    const frame = screen.getByTitle("HTML template preview");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(frame).toHaveAttribute("srcdoc");
    expect(frame).not.toHaveAttribute("src");
    expect(document.querySelector("[data-untrusted-preview]")).toBeNull();
    expect(screen.getByRole("button", { name: "Print preview" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Download preview as PNG" })).toBeEnabled();
  });

  it("removes the HTML preparation state when the isolated document loads", () => {
    render(
      <CodeEditorPanel
        {...baseProps}
        lang="html"
        code="<div>Generated card</div>"
      />
    );

    const frame = screen.getByTitle("HTML template preview");
    expect(screen.getByText("Preparing isolated preview…")).toBeInTheDocument();

    fireEvent.load(frame);

    expect(screen.queryByText("Preparing isolated preview…")).not.toBeInTheDocument();
  });

  it("offers a retry instead of leaving a failed preview loading forever", () => {
    vi.useFakeTimers();
    render(
      <CodeEditorPanel
        {...baseProps}
        lang="html"
        code="<div>Generated card</div>"
      />
    );

    act(() => vi.advanceTimersByTime(8_000));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The isolated preview did not start. Try reloading it."
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry preview" }));
    expect(screen.getByText("Preparing isolated preview…")).toBeInTheDocument();
  });

  it("renders React code inside the same self-contained opaque-origin sandbox", async () => {
    render(
      <CodeEditorPanel
        {...baseProps}
        lang="react"
        code={'export default function Template() { return <div>Untrusted React</div>; }'}
      />
    );

    const frame = screen.getByTitle("React template preview");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    await waitFor(() => expect(frame).toHaveAttribute("srcdoc"));
    expect(frame).not.toHaveAttribute("src");
    expect(screen.queryByText("Untrusted React")).not.toBeInTheDocument();
  });

  it("shows Angular as unavailable and skips it during keyboard navigation", async () => {
    const user = userEvent.setup();
    const onLangChange = vi.fn();
    render(
      <CodeEditorPanel
        {...baseProps}
        onLangChange={onLangChange}
        lang="react"
        code="export default function Template() { return null; }"
      />
    );

    const angular = screen.getByRole("tab", { name: /Angular.*Coming soon/i });
    expect(angular).toBeDisabled();
    expect(angular).toHaveAttribute("aria-disabled", "true");
    expect(angular).toHaveAttribute("tabindex", "-1");

    screen.getByRole("tab", { name: "React" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onLangChange).toHaveBeenLastCalledWith("html");
  });
});
