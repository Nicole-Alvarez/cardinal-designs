import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  template: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}));

const configuration = vi.hoisted(() => ({ getUserConfiguration: vi.fn() }));

vi.mock("../prisma", () => ({ default: prisma }));
vi.mock("./user-configuration.service", () => configuration);

import { create, getById, list, remove, update } from "./template.service";

describe("template ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configuration.getUserConfiguration.mockResolvedValue({ templateLimit: 5 });
    prisma.template.count.mockResolvedValue(0);
  });

  it("lists only templates owned by the authenticated user", async () => {
    prisma.template.findMany.mockResolvedValue([]);

    await list("user-a");

    expect(prisma.template.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-a" } })
    );
  });

  it("returns 404 when the owner-scoped lookup misses", async () => {
    prisma.template.findFirst.mockResolvedValue(null);

    await expect(getById("template-a", "user-b")).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prisma.template.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "template-a", userId: "user-b" } })
    );
  });

  it("assigns ownership and an empty description on create", async () => {
    prisma.template.create.mockResolvedValue({ id: "template-a" });

    await create("user-a");

    expect(prisma.template.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-a", description: "" }),
      })
    );
  });

  it("rejects new templates when the owner's limit is reached", async () => {
    configuration.getUserConfiguration.mockResolvedValue({ templateLimit: 1 });
    prisma.template.count.mockResolvedValue(1);
    await expect(create("user-a")).rejects.toMatchObject({ statusCode: 403 });
  });

  it("trims a valid description", async () => {
    prisma.template.update.mockResolvedValue({ id: "template-a" });

    await update("template-a", "user-a", { description: "  Member card  " });

    expect(prisma.template.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "template-a", userId: "user-a" },
        data: { description: "Member card" },
      })
    );
  });

  it("rejects descriptions longer than 500 characters", async () => {
    await expect(
      update("template-a", "user-a", { description: "x".repeat(501) })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("deletes by template ID and owner ID", async () => {
    prisma.template.delete.mockResolvedValue({ id: "template-a" });

    await remove("template-a", "user-a");

    expect(prisma.template.delete).toHaveBeenCalledWith({
      where: { id: "template-a", userId: "user-a" },
    });
  });
});
