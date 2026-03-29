import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mpin, currentMpin, password } = await req.json();
  if (!mpin || mpin.length !== 4) return NextResponse.json({ error: "Invalid MPIN" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { mpin: true, password: true },
  });

  // If an MPIN already exists, allow resetting it with the account password
  // from settings, while keeping current-MPIN support for existing flows.
  if (user?.mpin && user.mpin !== "") {
    if (password) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return NextResponse.json({ error: "Account password is incorrect" }, { status: 401 });
      }
    } else {
      if (!currentMpin || currentMpin.length !== 4) {
        return NextResponse.json(
          { error: "Enter your account password to reset MPIN" },
          { status: 400 }
        );
      }
      const valid = await bcrypt.compare(`${currentMpin}`, user.mpin);
      if (!valid) {
        return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 401 });
      }
    }
  }

  const hashed = await bcrypt.hash(mpin, 10);
  await prisma.user.update({
    where: { id: (session.user as any).id },
    data: { mpin: hashed },
  });

  return NextResponse.json({ success: true });
}
