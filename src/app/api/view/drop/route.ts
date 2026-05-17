
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { processDropView } from "@/lib/dropViewProcessor.server";
import { detectBot } from "@/lib/botDetection";
import { viewRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { dropId, userId } = await req.json();
    if (!dropId) return NextResponse.json({ error: "dropId required" }, { status: 400 });

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

    await processDropView(dropId, viewerId);
    return NextResponse.json({ success: true }, { status: 202 });

  } catch (error) {
    console.error("[/api/view/drop]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
