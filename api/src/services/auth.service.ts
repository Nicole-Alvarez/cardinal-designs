import argon2 from "argon2";
import crypto from "crypto";
import { config } from "../config";
import prisma from "../prisma";

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  name?: string;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode = 401) {
    super(message);
  }
}

export async function login({ username, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new AuthError("Invalid username or password");
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    throw new AuthError("Invalid username or password");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + config.sessionTtlMs);

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  return {
    token,
    expiresAt,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  };
}

export async function register({ username, password, name }: RegisterInput) {
  if (!username || username.includes(" ")) {
    throw new AuthError("Username cannot contain spaces", 400);
  }
  if (!password || password.length < 8) {
    throw new AuthError("Password must be at least 8 characters", 400);
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new AuthError("Username already taken", 409);
  }

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: { username, passwordHash, name, role: "member" },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + config.sessionTtlMs);

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  return {
    token,
    expiresAt,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  };
}

export async function logout(token?: string) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true, role: true },
  });
  if (!user) {
    throw new AuthError("User not found", 404);
  }
  return user;
}
