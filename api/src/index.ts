import app from "./app";
import { config } from "./config";
import prisma from "./prisma";

async function main() {
  await prisma.$connect();
  console.log("Prisma connected to the database");

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

main().catch(async (err) => {
  console.error("Failed to start API:", err);
  await prisma.$disconnect();
  process.exit(1);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
