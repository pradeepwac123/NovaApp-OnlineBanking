import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { identifier } = await req.json();
  if (!identifier) return NextResponse.json({ error: "Enter email or phone number" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
    select: { id: true },
  });

  if (!user) return NextResponse.json({ error: "No account found with this email or phone" }, { status: 404 });

  return NextResponse.json({ userId: user.id });
}
