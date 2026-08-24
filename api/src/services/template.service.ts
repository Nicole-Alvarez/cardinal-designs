import { Prisma, Template } from "@prisma/client";
import prisma from "../prisma";export class TemplateError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

const publicColumns = {
  id: true,
  title: true,
  content: true,
  html: true,
  react: true,
  angular: true,
  isCode: true,
  createdAt: true,
  updatedAt: true,
};

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export interface TemplateSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function list(): Promise<TemplateSummary[]> {
  return prisma.template.findMany({
    select: { id: true, title: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getById(id: string): Promise<Template> {
  const template = await prisma.template.findUnique({
    where: { id },
    select: publicColumns,
  });
  if (!template) {
    throw new TemplateError("Template not found", 404);
  }
  return template;
}

export async function create(): Promise<Template> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.template.create({
        data: { title: `Untitled-${randomSuffix()}` },
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
  content?: unknown;
  html?: unknown;
  react?: unknown;
  angular?: unknown;
  isCode?: unknown;
}

export async function update(
  id: string,
  input: UpdateTemplateInput
): Promise<Template> {
  const data: Prisma.TemplateUpdateInput = {};

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      throw new TemplateError("Title must be a non-empty string");
    }
    data.title = input.title.trim();
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
  if (input.isCode !== undefined) {
    if (typeof input.isCode !== "boolean") {
      throw new TemplateError("isCode must be a boolean");
    }
    data.isCode = input.isCode;
  }

  try {
    return await prisma.template.update({
      where: { id },
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

export async function remove(id: string): Promise<void> {
  try {
    await prisma.template.delete({ where: { id } });
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
