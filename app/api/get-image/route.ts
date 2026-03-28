import { NextRequest, NextResponse } from "next/server";
import { imageStore } from "@/lib/imageStore";

export async function GET(req: NextRequest) {
  const session = req.nextUrl.searchParams.get("session");
  const doc = req.nextUrl.searchParams.get("doc");

  if (!session || !doc) {
    return NextResponse.json({ image: null });
  }

  const image = imageStore.get(`${session}:${doc}`) || null;
  return NextResponse.json({ image });
}
