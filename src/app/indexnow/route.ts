import { NextResponse } from "next/server";
import { getLaunchSeoUrls, siteUrl } from "@/lib/seoUrls";

export async function GET() {
  const key = process.env.INDEXNOW_KEY || "";
  return NextResponse.json({
    host: new URL(siteUrl).host,
    key,
    keyLocation: key ? `${siteUrl}/${key}.txt` : "",
    urlList: getLaunchSeoUrls(),
  });
}

export async function POST() {
  const key = process.env.INDEXNOW_KEY || "";
  if (!key) {
    return NextResponse.json({ error: "Missing INDEXNOW_KEY" }, { status: 400 });
  }

  const host = new URL(siteUrl).host;
  const keyLocation = `${siteUrl}/${key}.txt`;
  const urlList = getLaunchSeoUrls();
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      host,
      key,
      keyLocation,
      urlList,
    }),
  });

  const text = await response.text();
  return NextResponse.json(
    {
      ok: response.ok,
      status: response.status,
      body: text,
    },
    { status: response.ok ? 200 : 502 }
  );
}
