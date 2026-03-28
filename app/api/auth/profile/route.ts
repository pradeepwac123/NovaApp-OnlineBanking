import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { firstName, lastName, email, phone, dob, password } = await req.json();
  if (!firstName || !lastName || !email || !phone || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const userId = (session.user as any).id as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
  }

  const duplicate = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      OR: [{ email }, { phone }],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ error: "Email or phone already in use" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName, email, phone, dob: dob || null },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      accountNo: true,
      upiId: true,
      balance: true,
      kycStatus: true,
      selfie: true,
      role: true,
      dob: true,
      blockedUntil: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, user: updatedUser });
}
