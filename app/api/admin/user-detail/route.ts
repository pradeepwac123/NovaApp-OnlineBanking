import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = req.nextUrl.searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      upiId: true, accountNo: true, balance: true, mpin: true, dob: true,
      aadhaarFront: true, aadhaarBack: true, pan: true, selfie: true,
      kycStatus: true, role: true, avatar: true, blockedUntil: true, createdAt: true,
      sentTransactions: { select: { id: true, amount: true, createdAt: true, receiver: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
      receivedTransactions: { select: { id: true, amount: true, createdAt: true, sender: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user: { ...user, mpin: "••••" } });
}
