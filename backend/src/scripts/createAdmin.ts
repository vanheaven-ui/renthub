import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdmin() {
  const email = "admin@example.com";
  const password = "supersecurepassword";

  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists.");
    return;
  }

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
    },
  });

  console.log("Admin created.");
}

createAdmin().finally(() => prisma.$disconnect());
