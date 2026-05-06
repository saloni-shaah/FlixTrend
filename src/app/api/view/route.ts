import { NextRequest, NextResponse } from "next/server";
import { startViewProcessor } from "@/lib/viewProcessor";

const queue: Array<{ videoId: string; userId: string; timestamp: number }> = [];

startViewProcessor(queue);

export async function POST(req: NextRequest) {
  try {
    const { videoId, userId } = await req.json();

    if (!videoId) {
      return NextResponse.json({ message: "Invalid request: videoId is required" }, { status: 400 });
    }

    queue.push({
      videoId,
      userId: userId || "anon",
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true }, { status: 202 });

  } catch (error) {
    console.error("[API /api/view] Error processing request:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
