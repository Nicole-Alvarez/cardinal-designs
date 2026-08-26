import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 3001;
const DEFAULT_SECRET = "change-me-in-production";
const SESSION_TTL_DAYS = 7;

export const config = {
  port: Number(process.env.PORT ?? DEFAULT_PORT),
  authSecretKey: process.env.AUTH_SECRET_KEY ?? DEFAULT_SECRET,
  frontendUrl: (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  sessionTtlMs: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  cookieName: "cardinal_session",
  blobToken: process.env.BLOB_READ_WRITE_TOKEN ?? "",
  publicBlobToken: process.env.PUBLIC_BLOB_READ_WRITE_TOKEN ?? "",
};
