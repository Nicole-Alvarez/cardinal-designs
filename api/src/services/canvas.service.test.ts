import { beforeEach, describe, expect, it, vi } from "vitest";
const prisma = vi.hoisted(() => ({ template: { findFirst: vi.fn() }, canvas: { count: vi.fn(), aggregate: vi.fn(), create: vi.fn() } }));
const configuration = vi.hoisted(() => ({ getUserConfiguration: vi.fn() }));
vi.mock("../prisma", () => ({ default: prisma }));
vi.mock("./user-configuration.service", () => configuration);
import { create } from "./canvas.service";
describe("canvas creation limits", () => { beforeEach(() => { vi.clearAllMocks(); prisma.template.findFirst.mockResolvedValue({ id: "template-a" }); }); it("rejects creation when the template has reached its owner's canvas limit", async () => { configuration.getUserConfiguration.mockResolvedValue({ canvasLimitPerTemplate: 2 }); prisma.canvas.count.mockResolvedValue(2); await expect(create("template-a", "user-a")).rejects.toMatchObject({ statusCode: 403 }); }); });
