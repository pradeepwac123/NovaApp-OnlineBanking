import { NextRequest, NextResponse } from "next/server";
import { signalStore } from "@/lib/signalStore";

// POST - store signaling data (offer, answer, ice candidates)
export async function POST(req: NextRequest) {
  try {
    const { session, type, data } = await req.json();
    if (!session || !type || !data) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const key = `${session}:${type}`;

    if (type === "ice-phone" || type === "ice-desktop") {
      // Accumulate ICE candidates
      const existing = signalStore.get(key) || [];
      existing.push(data);
      signalStore.set(key, existing);
    } else {
      signalStore.set(key, data);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Signal failed" }, { status: 500 });
  }
}

// GET - retrieve signaling data
export async function GET(req: NextRequest) {
  const session = req.nextUrl.searchParams.get("session");
  const type = req.nextUrl.searchParams.get("type");

  if (!session || !type) {
    return NextResponse.json({ data: null });
  }

  const key = `${session}:${type}`;
  const data = signalStore.get(key) || null;

  // For ICE candidates, return and clear
  if ((type === "ice-phone" || type === "ice-desktop") && data) {
    signalStore.delete(key);
  }

  return NextResponse.json({ data });
}

// DELETE - cleanup session
export async function DELETE(req: NextRequest) {
  const session = req.nextUrl.searchParams.get("session");
  if (session) {
    Array.from(signalStore.keys()).forEach((key) => {
      if (key.startsWith(session)) signalStore.delete(key);
    });
  }
  return NextResponse.json({ success: true });
}
