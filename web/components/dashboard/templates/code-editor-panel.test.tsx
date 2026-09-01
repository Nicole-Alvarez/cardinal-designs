import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CodeEditorPanel from "./code-editor-panel";

const baseProps = {
  lang: "html" as const,
  code: "<div>Generated card</div>",
  onCodeChange: vi.fn(),
  metadata: [],
  onOpenMetadata: vi.fn(),
  onConvertToWysiwyg: vi.fn(),
  onImportCode: vi.fn(),
};

describe("CodeEditorPanel", () => {
  it("renders the active code buffer with a readable language label", () => {
    render(<CodeEditorPanel {...baseProps} />);

    const textarea = screen.getByLabelText("HTML template code");
    expect(textarea).toHaveValue("<div>Generated card</div>");
    expect(screen.getAllByText("HTML").length).toBeGreaterThan(0);
  });

  it("edits the code buffer through onCodeChange", async () => {
    const user = userEvent.setup();
    const onCodeChange = vi.fn();
    render(<CodeEditorPanel {...baseProps} onCodeChange={onCodeChange} />);

    await user.type(screen.getByLabelText("HTML template code"), "x");
    expect(onCodeChange).toHaveBeenCalled();
  });

  it("opens the conversion disclaimer and confirms onConvertToWysiwyg", async () => {
    const user = userEvent.setup();
    const onConvertToWysiwyg = vi.fn();
    render(
      <CodeEditorPanel {...baseProps} lang="react" onConvertToWysiwyg={onConvertToWysiwyg} />
    );

    await user.click(screen.getByRole("button", { name: "Convert to Visual" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue conversion" }));
    expect(onConvertToWysiwyg).toHaveBeenCalledTimes(1);
  });

  it("opens the import dialog from the lang chip to change the code type", async () => {
    const user = userEvent.setup();
    render(<CodeEditorPanel {...baseProps} lang="react" code="export default function Card() {}" />);

    await user.click(
      screen.getByRole("button", { name: "Change code type (currently React)" })
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "React" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("opens the import dialog and forwards a pasted source through onImportCode", async () => {
    const user = userEvent.setup();
    const onImportCode = vi.fn();
    render(<CodeEditorPanel {...baseProps} onImportCode={onImportCode} />);

    await user.click(screen.getByRole("button", { name: "Import code" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("HTML code to import"),
      "<div>Imported</div>"
    );
    await user.click(screen.getByRole("button", { name: "Import" }));
    await user.click(screen.getByRole("button", { name: "Continue import" }));

    expect(onImportCode).toHaveBeenCalledWith("html", "<div>Imported</div>");
  });

  it("opens the metadata dialog through onOpenMetadata", async () => {
    const user = userEvent.setup();
    const onOpenMetadata = vi.fn();
    render(<CodeEditorPanel {...baseProps} onOpenMetadata={onOpenMetadata} />);

    await user.click(screen.getByRole("button", { name: "Preview data, 0 records" }));
    expect(onOpenMetadata).toHaveBeenCalledTimes(1);
  });
});
