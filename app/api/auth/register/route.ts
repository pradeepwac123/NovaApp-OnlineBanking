import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      dob,
      mpin,
      aadhaarFront,
      aadhaarBack,
      pan,
      selfie,
      kycStatus,
    } = await req.json();

    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (mpin && `${mpin}`.length !== 4) {
      return NextResponse.json({ error: "Invalid MPIN" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Email or phone already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const hashedMpin = mpin ? await bcrypt.hash(mpin, 10) : "";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const upiId = `${firstName.toLowerCase()}.${randomNum}@novapay`;
    const accountNo = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        upiId,
        accountNo,
        balance: 10000,
        mpin: hashedMpin,
        dob: dob || null,
        aadhaarFront: aadhaarFront || null,
        aadhaarBack: aadhaarBack || null,
        pan: pan || null,
        selfie: selfie || null,
        kycStatus: kycStatus || "pending",
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
