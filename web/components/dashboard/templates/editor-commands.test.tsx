import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EditorCommands from "./editor-commands";

describe("EditorCommands", () => {
  it("adds the selected block type directly", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();

    render(<EditorCommands onAdd={onAdd} />);

    expect(screen.queryByRole("button", { name: "Add divider" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add spacer" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add image" }));
    expect(onAdd).toHaveBeenLastCalledWith("image");

    await user.click(screen.getByRole("button", { name: "Add QR code" }));
    expect(onAdd).toHaveBeenLastCalledWith("qr");
  });
});
