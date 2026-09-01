import { Prisma } from "@prisma/client";
import prisma from "../prisma";

export class TemplateError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

const publicColumns = {
  id: true,
  title: true,
  description: true,
  isPrivate: true,
  isCode: true,
  createdAt: true,
  updatedAt: true,
  canvases: {
    select: {
      id: true,
      title: true,
      position: true,
    },
    take: 1,
    orderBy: { position: "asc" },
  },
};

type Template = Prisma.TemplateGetPayload<{ select: typeof publicColumns }>;

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export interface TemplateSummary {
  id: string;
  title: string;
  description: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  title?: string;
  description?: string;
  isPrivate?: boolean;
  isCode?: boolean;
}

export async function list(userId: string): Promise<TemplateSummary[]> {
  return prisma.template.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      description: true,
      isPrivate: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getById(id: string, userId: string): Promise<Template> {
  const template = await prisma.template.findFirst({
    where: { id, userId },
    select: publicColumns,
  });
  if (!template) {
    throw new TemplateError("Template not found", 404);
  }
  return template;
}

export async function create(
  userId: string,
  input?: CreateTemplateInput
): Promise<Template> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const title = input?.title?.trim() || `Untitled-${randomSuffix()}`;
      const description = input?.description?.trim() || "";
      const isPrivate = input?.isPrivate ?? true;
      const isCode = input?.isCode ?? false;
      return await prisma.template.create({
        data: {
          userId,
          title,
          description,
          isPrivate,
          isCode,
          canvases: {
            create: {
              title,
              position: 0,
            },
          },
        },
        select: publicColumns,
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
  throw new TemplateError("Could not generate a unique title", 500);
}

export interface UpdateTemplateInput {
  title?: unknown;
  description?: unknown;
  isPrivate?: unknown;
  isCode?: unknown;
}

function normalizeDescription(value: unknown): string {
  if (typeof value !== "string") {
    throw new TemplateError("Description must be a string");
  }
  const description = value.trim();
  if (description.length > 500) {
    throw new TemplateError("Description must be 500 characters or fewer");
  }
  return description;
}

export async function update(
  id: string,
  userId: string,
  input: UpdateTemplateInput
): Promise<Template> {
  const data: Prisma.TemplateUpdateInput = {};

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      throw new TemplateError("Title must be a non-empty string");
    }
    data.title = input.title.trim();
  }
  if (input.description !== undefined) {
    data.description = normalizeDescription(input.description);
  }
  if (input.isPrivate !== undefined) {
    if (typeof input.isPrivate !== "boolean") {
      throw new TemplateError("isPrivate must be a boolean");
    }
    data.isPrivate = input.isPrivate;
  }
  if (input.isCode !== undefined) {
    if (typeof input.isCode !== "boolean") {
      throw new TemplateError("isCode must be a boolean");
    }
    data.isCode = input.isCode;
  }

  try {
    return await prisma.template.update({
      where: { id, userId },
      data,
      select: publicColumns,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        throw new TemplateError("Template not found", 404);
      }
      if (err.code === "P2002") {
        throw new TemplateError("A template with that title already exists", 409);
      }
    }
    throw err;
  }
}

export async function remove(id: string, userId: string): Promise<void> {
  try {
    await prisma.template.delete({ where: { id, userId } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new TemplateError("Template not found", 404);
    }
    throw err;
  }
}
