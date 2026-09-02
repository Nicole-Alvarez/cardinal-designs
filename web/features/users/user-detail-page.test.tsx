import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn().mockResolvedValue({ user: { username: "Admin", name: "Admin" }, configuration: { version: 1, templateLimit: 5, canvasLimitPerTemplate: 2, canUseGenerateAI: false, metadataEnabled: true, canDownloadAssets: false } }) }));
import UserDetailPage from "./user-detail-page";
describe("UserDetailPage", () => {
  it("renders configuration save controls", () => {
    render(<UserDetailPage userId="user-a" />);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });
});
