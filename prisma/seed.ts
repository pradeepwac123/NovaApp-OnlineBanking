import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password1 = await bcrypt.hash("Test@1234", 12);
  const password2 = await bcrypt.hash("Test@1234", 12);
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const dummyMpin = await bcrypt.hash("1234", 10);

  await prisma.user.upsert({
    where: { email: "demo1@novapay.in" },
    update: {},
    create: {
      firstName: "Priya",
      lastName: "Sharma",
      email: "demo1@novapay.in",
      phone: "9000000001",
      password: password1,
      upiId: "demo1.1001@novapay",
      accountNo: "100100100101",
      balance: 50000,
      mpin: dummyMpin,
      kycStatus: "verified",
      role: "user",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo2@novapay.in" },
    update: {},
    create: {
      firstName: "Raj",
      lastName: "Kumar",
      email: "demo2@novapay.in",
      phone: "9000000002",
      password: password2,
      upiId: "demo2.2002@novapay",
      accountNo: "200200200202",
      balance: 25000,
      mpin: dummyMpin,
      kycStatus: "verified",
      role: "user",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@novapay.in" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "NovaPay",
      email: "admin@novapay.in",
      phone: "9000000000",
      password: adminPassword,
      upiId: "admin.0000@novapay",
      accountNo: "999999999999",
      balance: 999999,
      mpin: dummyMpin,
      kycStatus: "verified",
      role: "admin",
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
