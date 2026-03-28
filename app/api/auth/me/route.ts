import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
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

  return NextResponse.json({ user });
}
