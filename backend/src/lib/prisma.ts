import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["warn", "error"]
        : ["warn", "error"],
    errorFormat: "pretty", // Human-readable errors
  });

// Retry connection on init (helps with cold starts/DB lag)
let retryCount = 0;
const maxRetries = 5;
const connectWithRetry = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected successfully");
  } catch (err) {
    if (retryCount < maxRetries) {
      retryCount++;
      console.warn(`⚠️ Prisma connection failed (attempt ${retryCount}/${maxRetries}):`, err);
      setTimeout(connectWithRetry, 2000 * retryCount); // Exponential backoff
    } else {
      console.error("❌ Prisma connection failed after retries:", err);
      process.exit(1);
    }
  }
};

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Auto-connect on import (non-blocking)
connectWithRetry().catch(console.error);