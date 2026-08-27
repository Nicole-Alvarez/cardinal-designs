import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Disclosure from "./disclosure";

describe("Disclosure", () => {
  it("reveals optional controls with native expanded semantics", async () => {
    const user = userEvent.setup();
    render(
      <Disclosure title="Advanced" defaultOpen={false}>
        <p>Stacking</p>
      </Disclosure>
    );

    const trigger = screen.getByRole("button", { name: "Advanced" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Stacking")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Stacking")).toBeVisible();
  });
});
