import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queries = vi.hoisted(() => ({
  listTemplates: vi.fn(),
  createTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("./queries", () => queries);

import TemplatesPage from "./templates-page";

describe("TemplatesPage loading errors", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses collection-shaped skeleton rows while templates load", () => {
    queries.listTemplates.mockReturnValue(new Promise(() => undefined));

    render(<TemplatesPage />);

    const loadingState = screen.getByRole("status", { name: "Loading templates" });
    expect(loadingState).toBeInTheDocument();
    expect(loadingState.querySelectorAll("article")).toHaveLength(3);
  });

  it("replaces the loading state with a recoverable error and retries", async () => {
    queries.listTemplates
      .mockRejectedValueOnce(new Error("Templates are unavailable."))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<TemplatesPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Templates are unavailable.");
    expect(screen.queryByText("Loading templates")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Create your first template")).toBeInTheDocument();
    expect(queries.listTemplates).toHaveBeenCalledTimes(2);
  });
});
