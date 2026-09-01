import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const queries = vi.hoisted(() => ({
  listTemplates: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("../templates/queries", () => queries);

import DashboardPage from "./dashboard-page";

const templateSummary = {
  id: "member-card",
  title: "Member card",
  description: "A member card template",
  isPrivate: false,
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-26T10:00:00.000Z",
};

function template(id: string, title: string, updatedAt: string) {
  return { ...templateSummary, id, title, updatedAt };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queries.listTemplates.mockResolvedValue([]);
  });

  it("shows the four most recently updated templates in descending order", async () => {
    queries.listTemplates.mockResolvedValue([
      template("oldest", "Oldest", "2026-08-20T10:00:00.000Z"),
      templateSummary,
      template("fourth", "Fourth", "2026-08-23T10:00:00.000Z"),
      template("newest", "Newest", "2026-08-27T10:00:00.000Z"),
      template("third", "Third", "2026-08-25T10:00:00.000Z"),
    ]);

    render(<DashboardPage name="Nicole" />);

    expect(screen.getByRole("button", { name: "Create template" })).toBeEnabled();
    expect(await screen.findByRole("link", { name: /Member card/ })).toBeInTheDocument();
    const recentWork = screen.getByRole("heading", { name: "Recent work" }).closest("section");
    const templateLinks = within(recentWork as HTMLElement)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") !== "/dashboard/templates");

    expect(templateLinks.map((link) => link.textContent)).toEqual([
      "NewestA member card template",
      "Member cardA member card template",
      "ThirdA member card template",
      "FourthA member card template",
    ]);
    expect(within(recentWork as HTMLElement).queryByRole("link", { name: "Oldest" })).not.toBeInTheDocument();
  });

  it("keeps create available when recent templates cannot load and recovers on retry", async () => {
    queries.listTemplates
      .mockRejectedValueOnce(new Error("Recent templates unavailable"))
      .mockResolvedValueOnce([templateSummary]);
    const user = userEvent.setup();

    render(<DashboardPage name="Nicole" />);

    expect(await screen.findByRole("status")).toHaveTextContent("Recent templates unavailable");
    expect(screen.getByRole("button", { name: "Create template" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("link", { name: /Member card/ })).toBeInTheDocument();
    expect(queries.listTemplates).toHaveBeenCalledTimes(2);
  });

  it("explains when there are no recent templates", async () => {
    render(<DashboardPage name="Nicole" />);

    expect(
      await screen.findByText("No templates yet. Create one to start building reusable card designs.")
    ).toBeInTheDocument();
  });

  it("announces direct creation, routes to the new editor, and rejects re-entrant creation", async () => {
    render(<DashboardPage name="Nicole" />);
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));

    expect(screen.getByRole("button", { name: "Creating template..." })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Creating template...");
    expect(router.push).toHaveBeenCalledWith("/dashboard/templates/new");

    // Second click should be rejected
    fireEvent.click(screen.getByRole("button", { name: "Creating template..." }));
    expect(router.push).toHaveBeenCalledTimes(1);
  });
});
