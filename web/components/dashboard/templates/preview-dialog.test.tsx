import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PreviewDialog from "./preview-dialog";

const baseProps = {
  title: "Member card",
  html: "<div>HTML output</div>",
  previewHtml: ["<div>Preview</div>"],
  react: "export default function Card() {}",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("PreviewDialog", () => {
  it("renders the static batch preview for wysiwyg mode with export actions", () => {
    render(
      <PreviewDialog
        {...baseProps}
        open
        mode="wysiwyg"
        lang="html"
        code=""
        metadata={[]}
        onClose={vi.fn()}
      />
    );

    expect(document.querySelector("[data-template-preview-batch]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Print preview" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Download preview as PNG" })).toBeEnabled();
  });

  it("centers the wysiwyg preview card horizontally", () => {
    render(
      <PreviewDialog
        {...baseProps}
        open
        mode="wysiwyg"
        lang="html"
        code=""
        metadata={[]}
        onClose={vi.fn()}
      />
    );

    const batch = document.querySelector("[data-template-preview-batch]");
    const card = batch?.closest<HTMLElement>(".mx-auto");
    expect(card).not.toBeNull();
    expect(card?.className).toContain("w-fit");
  });

  it("copies the generated HTML code to the clipboard", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(
      <PreviewDialog
        {...baseProps}
        open
        mode="wysiwyg"
        lang="html"
        code=""
        metadata={[]}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Copy HTML code" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("<div>HTML output</div>");
    expect(await screen.findByRole("button", { name: "Code copied" })).toBeInTheDocument();
  });

  it("renders pasted HTML inside an opaque-origin sandbox for code mode", () => {
    render(
      <PreviewDialog
        {...baseProps}
        open
        mode="code"
        lang="html"
        code={
          '<section data-untrusted-preview><img src="https://example.com/untrusted.png" alt="untrusted" onerror="window.parent.document.body.remove()"></section>'
        }
        metadata={[]}
        onClose={vi.fn()}
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
      <PreviewDialog
        {...baseProps}
        open
        mode="code"
        lang="html"
        code="<div>Generated card</div>"
        metadata={[]}
        onClose={vi.fn()}
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
      <PreviewDialog
        {...baseProps}
        open
        mode="code"
        lang="html"
        code="<div>Generated card</div>"
        metadata={[]}
        onClose={vi.fn()}
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
      <PreviewDialog
        {...baseProps}
        open
        mode="code"
        lang="react"
        code={'export default function Template() { return <div>Untrusted React</div>; }'}
        metadata={[]}
        onClose={vi.fn()}
      />
    );

    const frame = screen.getByTitle("React template preview");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    await waitFor(() => expect(frame).toHaveAttribute("srcdoc"));
    expect(frame).not.toHaveAttribute("src");
    expect(screen.queryByText("Untrusted React")).not.toBeInTheDocument();
  });

  it("places the footer action tooltips above the buttons so they are not clipped", () => {
    render(
      <PreviewDialog
        {...baseProps}
        open
        mode="wysiwyg"
        lang="html"
        code=""
        metadata={[]}
        onClose={vi.fn()}
      />
    );

    const tooltips = screen.getAllByRole("tooltip");
    expect(tooltips.length).toBeGreaterThan(0);
    for (const tooltip of tooltips) {
      expect(tooltip.className).toContain("bottom-full");
      expect(tooltip.className).not.toContain("top-full");
    }
  });
});
