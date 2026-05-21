
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { processSongView } from "@/lib/songViewProcessor.server";
import { detectBot } from "@/lib/botDetection";
import { viewRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { songId, userId } = await req.json();
    if (!songId) return NextResponse.json({ error: "songId required" }, { status: 400 });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? "";

    const { isBot } = detectBot(userAgent, ip);
    if (isBot) {
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const { success: ipAllowed } = await viewRateLimit.limit(ip);
    if (!ipAllowed) {
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const viewerId = userId && userId !== "anon"
      ? userId
      : "anon:" + createHash("sha256").update(`${ip}:${userAgent}`).digest("hex").slice(0, 16);

    await processSongView(songId, viewerId);
    return NextResponse.json({ success: true }, { status: 202 });

  } catch (error) {
    console.error("[/api/songs/view]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
