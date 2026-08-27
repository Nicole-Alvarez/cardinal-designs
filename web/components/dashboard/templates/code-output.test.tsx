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

  it("shows Angular as unavailable and excludes it from tab navigation", async () => {
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

    const angular = screen.getByRole("tab", { name: /Angular.*Coming soon/i });
    expect(angular).toBeDisabled();
    expect(angular).toHaveAttribute("aria-disabled", "true");
    expect(angular).toHaveAttribute("tabindex", "-1");

    const react = screen.getByRole("tab", { name: "React" });
    react.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveFocus();
    expect(screen.queryByText("export class Card {}")).not.toBeInTheDocument();
  });
});
