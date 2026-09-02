import { Prisma } from "@prisma/client";
import prisma from "../prisma";
import { getUserConfiguration } from "./user-configuration.service";

export class CanvasError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

const canvasPublicColumns = {
  id: true,
  title: true,
  position: true,
  createdAt: true,
  updatedAt: true,
};

const canvasFullColumns = {
  ...canvasPublicColumns,
  content: true,
  html: true,
  react: true,
  angular: true,
};

type CanvasSummary = Prisma.CanvasGetPayload<{ select: typeof canvasPublicColumns }>;
type CanvasFull = Prisma.CanvasGetPayload<{ select: typeof canvasFullColumns }>;

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

async function verifyTemplateOwnership(templateId: string, userId: string) {
  const template = await prisma.template.findFirst({
    where: { id: templateId, userId },
    select: { id: true },
  });
  if (!template) {
    throw new CanvasError("Template not found", 404);
  }
}

export async function listByTemplate(
  templateId: string,
  userId: string
): Promise<CanvasSummary[]> {
  await verifyTemplateOwnership(templateId, userId);
  return prisma.canvas.findMany({
    where: { templateId },
    select: canvasPublicColumns,
    orderBy: { position: "asc" },
  });
}

export async function getById(
  canvasId: string,
  templateId: string,
  userId: string
): Promise<CanvasFull> {
  await verifyTemplateOwnership(templateId, userId);
  const canvas = await prisma.canvas.findFirst({
    where: { id: canvasId, templateId },
    select: canvasFullColumns,
  });
  if (!canvas) {
    throw new CanvasError("Canvas not found", 404);
  }
  return canvas;
}

export async function create(
  templateId: string,
  userId: string
): Promise<CanvasFull> {
  await verifyTemplateOwnership(templateId, userId);
  const configuration = await getUserConfiguration(userId);
  const canvasCount = await prisma.canvas.count({ where: { templateId } });
  if (canvasCount >= configuration.canvasLimitPerTemplate) {
    throw new CanvasError("Canvas limit reached for this template", 403);
  }

  const maxPosition = await prisma.canvas.aggregate({
    where: { templateId },
    _max: { position: true },
  });
  const nextPosition = (maxPosition._max.position ?? -1) + 1;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.canvas.create({
        data: {
          templateId,
          title: `Untitled-${randomSuffix()}`,
          position: nextPosition,
        },
        select: canvasFullColumns,
      });
    } catch (err) {
      const isUniqueViolation =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002";
      if (!isUniqueViolation || attempt === 4) {
        throw err;
      }
    }
  }
  throw new CanvasError("Could not generate a unique title", 500);
}

export interface UpdateCanvasInput {
  title?: unknown;
  position?: unknown;
  content?: unknown;
  html?: unknown;
  react?: unknown;
  angular?: unknown;
}

export async function update(
  canvasId: string,
  templateId: string,
  userId: string,
  input: UpdateCanvasInput
): Promise<CanvasFull> {
  await verifyTemplateOwnership(templateId, userId);

  const data: Prisma.CanvasUpdateInput = {};

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      throw new CanvasError("Title must be a non-empty string");
    }
    data.title = input.title.trim();
  }
  if (input.position !== undefined) {
    if (typeof input.position !== "number") {
      throw new CanvasError("Position must be a number");
    }
    data.position = input.position;
  }
  if (input.content !== undefined) {
    data.content = input.content as Prisma.InputJsonValue;
  }
  if (input.html !== undefined) {
    data.html = typeof input.html === "string" ? input.html : null;
  }
  if (input.react !== undefined) {
    data.react = typeof input.react === "string" ? input.react : null;
  }
  if (input.angular !== undefined) {
    data.angular = typeof input.angular === "string" ? input.angular : null;
  }

  try {
    return await prisma.canvas.update({
      where: { id: canvasId, templateId },
      data,
      select: canvasFullColumns,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        throw new CanvasError("Canvas not found", 404);
      }
      if (err.code === "P2002") {
        throw new CanvasError("A canvas with that title already exists in this template", 409);
      }
    }
    throw err;
  }
}

export async function setGeneratedImageSource(
  canvasId: string,
  templateId: string,
  userId: string,
  blockId: string,
  src: string,
): Promise<CanvasFull> {
  await verifyTemplateOwnership(templateId, userId);
  const canvas = await prisma.canvas.findFirst({ where: { id: canvasId, templateId }, select: canvasFullColumns });
  if (!canvas) throw new CanvasError("Canvas not found", 404);
  const content = canvas.content && typeof canvas.content === "object" && !Array.isArray(canvas.content)
    ? canvas.content as { blocks?: unknown[] }
    : null;
  if (!content || !Array.isArray(content.blocks)) throw new CanvasError("Canvas content is invalid", 409);
  let found = false;
  const blocks = content.blocks.map((block) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) return block;
    const value = block as Record<string, unknown>;
    if (value.id !== blockId) return block;
    found = true;
    if (value.type !== "image") throw new CanvasError("Block is not an image", 400);
    if (typeof value.src === "string" && value.src) throw new CanvasError("Image block already has an asset", 409);
    return { ...value, src };
  });
  if (!found) throw new CanvasError("Image block not found", 404);
  return prisma.canvas.update({
    where: { id: canvasId, templateId },
    data: { content: { ...(canvas.content as Prisma.JsonObject), blocks } as Prisma.InputJsonValue },
    select: canvasFullColumns,
  });
}

export async function remove(
  canvasId: string,
  templateId: string,
  userId: string
): Promise<void> {
  await verifyTemplateOwnership(templateId, userId);

  const canvasCount = await prisma.canvas.count({
    where: { templateId },
  });
  if (canvasCount <= 1) {
    throw new CanvasError("Cannot delete the last canvas", 400);
  }

  try {
    await prisma.canvas.delete({
      where: { id: canvasId, templateId },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new CanvasError("Canvas not found", 404);
    }
    throw err;
  }
}
