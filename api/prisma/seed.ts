import argon2 from "argon2";
import dotenv from "dotenv";
import path from "path";
import prisma from "../src/prisma";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const username = "admin";
  const password = "admin123";
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash, name: "Admin" },
  });

  console.log("Seeded user:", user.username, "(password: admin123)");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
