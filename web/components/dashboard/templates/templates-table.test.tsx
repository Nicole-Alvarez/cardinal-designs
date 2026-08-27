import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TemplatesTable from "./templates-table";

const template = {
  id: "template-1",
  title: "Member card",
  description: "A reusable member card",
  isPrivate: false,
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-26T10:00:00.000Z",
};

describe("TemplatesTable", () => {
  it("provides one clear open link and a labelled delete action", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(<TemplatesTable templates={[template]} onDelete={onDelete} deletingId={null} />);

    expect(screen.getAllByRole("link", { name: /Member card/ })).toHaveLength(1);
    expect(screen.getByText("Anyone with link")).toBeInTheDocument();
    const deleteButton = screen.getByRole("button", { name: "Delete Member card" });
    expect(deleteButton).toBeEnabled();

    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith("template-1");
  });
});
