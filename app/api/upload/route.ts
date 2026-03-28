import { NextRequest, NextResponse } from "next/server";
import { imageStore } from "@/lib/imageStore";

export async function POST(req: NextRequest) {
  try {
    const { session, doc, image } = await req.json();
    if (!session || !doc || !image) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    imageStore.set(`${session}:${doc}`, image);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
