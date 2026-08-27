import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AppShell from "./app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

describe("AppShell mobile navigation", () => {
  it("opens as a keyboard-contained dialog and restores focus when closed", async () => {
    const user = userEvent.setup();
    render(
      <AppShell user={{ username: "nicole", name: "Nicole", role: "admin" }}>
        <p>Dashboard content</p>
      </AppShell>
    );

    const opener = screen.getByRole("button", { name: "Open menu" });
    await user.click(opener);
    expect(screen.getByRole("dialog", { name: "Main navigation" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Main navigation" })).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
