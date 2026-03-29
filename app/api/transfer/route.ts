import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { toIdentifier, amount, note, mpin } = await req.json();
    const senderId = (session.user as any).id;

    if (!toIdentifier || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid transfer details" }, { status: 400 });
    }

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    if (sender.blockedUntil && sender.blockedUntil > new Date()) {
      return NextResponse.json({ error: "Your account is temporarily blocked" }, { status: 403 });
    }
    if (sender.kycStatus !== "verified") return NextResponse.json({ error: "Complete KYC to make transfers" }, { status: 403 });
    if (!sender.mpin) return NextResponse.json({ error: "Set your MPIN before sending money" }, { status: 400 });
    if (!mpin || `${mpin}`.length !== 4) {
      return NextResponse.json({ error: "Enter your 4-digit MPIN" }, { status: 400 });
    }
    const mpinValid = await bcrypt.compare(`${mpin}`, sender.mpin);
    if (!mpinValid) return NextResponse.json({ error: "Invalid MPIN" }, { status: 401 });
    if (sender.balance < amount) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    const receiver = await prisma.user.findFirst({
      where: { OR: [{ phone: toIdentifier }, { upiId: toIdentifier }] },
    });
    if (!receiver) return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    if (receiver.blockedUntil && receiver.blockedUntil > new Date()) {
      return NextResponse.json({ error: "Receiver account is temporarily blocked" }, { status: 403 });
    }
    if (receiver.id === senderId) return NextResponse.json({ error: "Cannot send to yourself" }, { status: 400 });

    const [updatedSender] = await prisma.$transaction([
      prisma.user.update({ where: { id: senderId }, data: { balance: { decrement: amount } } }),
      prisma.user.update({ where: { id: receiver.id }, data: { balance: { increment: amount } } }),
      prisma.transaction.create({
        data: { senderId, receiverId: receiver.id, amount, note: note || null, status: "success" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      newBalance: updatedSender.balance,
      receiver: { firstName: receiver.firstName, lastName: receiver.lastName },
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
  }
}
