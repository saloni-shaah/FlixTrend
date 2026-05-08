import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { processView } from "@/lib/viewProcessor.server";
import { detectBot } from "@/lib/botDetection";
import { detectSuspiciousPattern } from "@/lib/suspiciousPattern";
import { viewRateLimit } from "@/lib/rateLimit";

function getViewerId(userId: string | undefined, ip: string, userAgent: string): string {
  if (userId && userId !== "anon") return userId;
  // hash ip + ua for anonymous dedup — never stored, just used as key
  return "anon:" + createHash("sha256").update(`${ip}:${userAgent}`).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest) {
  try {
    const { videoId, userId, duration } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: "videoId required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? "";
    const viewerId = getViewerId(userId, ip, userAgent);

    // ── 1. Bot detection ──────────────────────────────────────────────
    const { isBot, reason } = detectBot(userAgent, ip);
    if (isBot) {
      console.warn(`[/api/view] Bot blocked — reason: ${reason} ip: ${ip}`);
      return NextResponse.json({ success: true }, { status: 202 });
    }

    // ── 2. IP rate limit ──────────────────────────────────────────────
    const { success: ipAllowed } = await viewRateLimit.limit(ip);
    if (!ipAllowed) {
      console.warn(`[/api/view] Rate limited — ip: ${ip} videoId: ${videoId}`);
      return NextResponse.json({ success: true }, { status: 202 });
    }

    // ── 3. Suspicious pattern detection ──────────────────────────────
    const isSuspicious = await detectSuspiciousPattern(videoId, viewerId, ip);
    if (isSuspicious) {
      console.warn(`[/api/view] Suspicious pattern — viewerId: ${viewerId} videoId: ${videoId}`);
      return NextResponse.json({ success: true }, { status: 202 });
    }

    // ── 4. Process view ───────────────────────────────────────────────
    await processView(videoId, viewerId);
    return NextResponse.json({ success: true }, { status: 202 });

  } catch (error) {
    console.error("[/api/view]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
