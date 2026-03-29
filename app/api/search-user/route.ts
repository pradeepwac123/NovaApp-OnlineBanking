import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "No query" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: {
      AND: [
        {
          OR: [
            { phone: q },
            { upiId: q },
            { email: q },
            { accountNo: q },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        },
        {
          OR: [
            { blockedUntil: null },
            { blockedUntil: { lte: new Date() } },
          ],
        },
      ],
    },
    select: { id: true, firstName: true, lastName: true, upiId: true, phone: true },
  });

  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });
  return NextResponse.json({ user });
}
