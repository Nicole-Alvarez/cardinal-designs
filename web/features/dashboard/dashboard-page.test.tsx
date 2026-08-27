import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const queries = vi.hoisted(() => ({
  listTemplates: vi.fn(),
  createTemplate: vi.fn(),
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

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a usable create action and recent templates", async () => {
    queries.listTemplates.mockResolvedValue([templateSummary]);

    render(<DashboardPage name="Nicole" />);

    expect(screen.getByRole("button", { name: "Create template" })).toBeEnabled();
    expect(await screen.findByRole("link", { name: /Member card/ })).toBeInTheDocument();
  });

  it("keeps create available when recent templates cannot load", async () => {
    queries.listTemplates.mockRejectedValueOnce(new Error("Recent templates unavailable"));

    render(<DashboardPage name="Nicole" />);

    expect(await screen.findByRole("status")).toHaveTextContent("Recent templates unavailable");
    expect(screen.getByRole("button", { name: "Create template" })).toBeEnabled();
  });
});
