import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CodeImportDialog from "./code-import-dialog";

describe("CodeImportDialog", () => {
  it("toggles the source type, updating the import textarea label", async () => {
    const user = userEvent.setup();
    render(<CodeImportDialog open onClose={vi.fn()} onImport={vi.fn()} />);

    const html = screen.getByRole("radio", { name: "HTML" });
    expect(html).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("HTML code to import")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "React" }));
    expect(screen.getByRole("radio", { name: "React" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByLabelText("React code to import")).toBeInTheDocument();
  });

  it("preselects the React source type from initialType", () => {
    render(
      <CodeImportDialog open initialType="react" onClose={vi.fn()} onImport={vi.fn()} />
    );

    expect(screen.getByRole("radio", { name: "React" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByLabelText("React code to import")).toBeInTheDocument();
  });

  it("imports pasted HTML after confirming the disclaimer, disabling submit until source is provided", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<CodeImportDialog open onClose={vi.fn()} onImport={onImport} />);

    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
    await user.type(screen.getByLabelText("HTML code to import"), "<div>Hi</div>");
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(onImport).not.toHaveBeenCalled();
    expect(screen.getByText(/Import is best-effort/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue import" }));
    expect(onImport).toHaveBeenCalledWith("html", "<div>Hi</div>");
  });

  it("does not import when cancelling the disclaimer", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<CodeImportDialog open onClose={vi.fn()} onImport={onImport} />);

    await user.type(screen.getByLabelText("HTML code to import"), "<div>Hi</div>");
    await user.click(screen.getByRole("button", { name: "Import" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onImport).not.toHaveBeenCalled();
  });

  it("imports pasted React code after confirming the disclaimer", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<CodeImportDialog open onClose={vi.fn()} onImport={onImport} />);

    await user.click(screen.getByRole("radio", { name: "React" }));
    fireEvent.change(screen.getByLabelText("React code to import"), {
      target: { value: "export default function Card() {}" },
    });
    await user.click(screen.getByRole("button", { name: "Import" }));
    await user.click(screen.getByRole("button", { name: "Continue import" }));

    expect(onImport).toHaveBeenCalledWith(
      "react",
      "export default function Card() {}"
    );
  });

  it("detects a React file by extension, reads it, and imports after confirming the disclaimer", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<CodeImportDialog open onClose={vi.fn()} onImport={onImport} />);

    const file = new File(["export default function Card() {}"], "Card.tsx", {
      type: "text/plain",
    });
    const input = screen.getByLabelText("Upload code file");
    await user.upload(input, file);

    await user.click(screen.getByRole("button", { name: "Import" }));
    await user.click(screen.getByRole("button", { name: "Continue import" }));
    expect(onImport).toHaveBeenCalledWith(
      "react",
      "export default function Card() {}"
    );
  });
});
