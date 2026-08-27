import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CodeOutput from "./code-output";

describe("CodeOutput tabs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("supports arrow-key navigation and roving tab stops", async () => {
    const user = userEvent.setup();
    render(
      <CodeOutput
        title="Member card"
        html="<div>HTML output</div>"
        previewHtml={["<div>Preview</div>"]}
        reactCode="export default function Card() {}"
        angularCode="export class Card {}"
      />
    );

    const preview = screen.getByRole("tab", { name: "Preview" });
    preview.focus();
    await user.keyboard("{ArrowRight}");

    const html = screen.getByRole("tab", { name: "HTML" });
    expect(html).toHaveFocus();
    expect(html).toHaveAttribute("aria-selected", "true");
    expect(preview).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("<div>HTML output</div>")).toBeInTheDocument();
  });

  it("announces clipboard failures instead of leaving an unhandled rejection", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("Clipboard access was denied.")
    );
    render(
      <CodeOutput
        title="Member card"
        html="<div>HTML output</div>"
        previewHtml={["<div>Preview</div>"]}
        reactCode="export default function Card() {}"
        angularCode="export class Card {}"
      />
    );

    await user.click(screen.getByRole("tab", { name: "HTML" }));
    await user.click(screen.getByRole("button", { name: "Copy html code" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Clipboard access was denied."
    );
  });
});
