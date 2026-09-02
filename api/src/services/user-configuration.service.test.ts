import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  userConfiguration: { upsert: vi.fn(), updateMany: vi.fn() },
}));

vi.mock("../prisma", () => ({ default: prisma }));

import { getUserConfiguration, updateUserConfiguration } from "./user-configuration.service";

describe("user configuration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates missing configuration with product defaults", async () => {
    prisma.userConfiguration.upsert.mockResolvedValue({ userId: "user-a" });

    await getUserConfiguration("user-a");

    expect(prisma.userConfiguration.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-a" },
      create: expect.objectContaining({ userId: "user-a", templateLimit: 5, canvasLimitPerTemplate: 2, canUseGenerateAI: false, metadataEnabled: true, canDownloadAssets: false }),
    }));
  });

  it("rejects stale configuration updates", async () => {
    prisma.userConfiguration.updateMany.mockResolvedValue({ count: 0 });

    await expect(updateUserConfiguration("user-a", 2, { templateLimit: 8 })).rejects.toMatchObject({ statusCode: 409 });
  });
});
