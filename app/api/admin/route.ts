import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = new Set(["admin", "super_admin", "superadmin"]);

function isAdminRole(role: string | undefined) {
  return !!role && ADMIN_ROLES.has(role);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminRole((session.user as any).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, transactions, totalBalance] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        upiId: true,
        accountNo: true,
        balance: true,
        kycStatus: true,
        role: true,
        blockedUntil: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.transaction.findMany({
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        amount: true,
        note: true,
        status: true,
        createdAt: true,
        sender: { select: { firstName: true, lastName: true } },
        receiver: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.user.aggregate({ _sum: { balance: true } })
  ]);

  return NextResponse.json({
    users,
    transactions,
    stats: {
      totalUsers: users.length,
      totalTransactions: transactions.length,
      totalBalance: totalBalance._sum.balance || 0
    }
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminRole((session.user as any).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, amount } = await req.json();
  if (!userId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { balance: { increment: amount } }
  });

  return NextResponse.json({ success: true, newBalance: user.balance });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminRole((session.user as any).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action } = await req.json();
  if (!userId || !action) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (userId === (session.user as any).id && action !== "approveKyc") {
    return NextResponse.json({ error: "Cannot modify your own account status" }, { status: 400 });
  }

  let data;
  if (action === "block") {
    data = { blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  } else if (action === "unblock") {
    data = { blockedUntil: null };
  } else if (action === "approveKyc") {
    data = { kycStatus: "verified" };
  } else {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, blockedUntil: true, kycStatus: true }
  });

  return NextResponse.json({ success: true, user });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminRole((session.user as any).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  if (userId === (session.user as any).id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
    prisma.user.delete({ where: { id: userId } })
  ]);

  return NextResponse.json({ success: true });
}
