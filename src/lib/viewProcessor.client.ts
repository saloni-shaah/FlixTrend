export async function trackView(videoId: string, userId?: string, duration?: number) {
  if (typeof window === "undefined" || !videoId) return;
  try {
    await fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        userId: userId || "anon",
        duration: duration ?? 0,
      }),
      keepalive: true,
    });
  } catch {}
}
