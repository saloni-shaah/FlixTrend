import { NextResponse } from "next/server";
import { helpCategories } from "@/data/help";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flixtrend.in";

function getLaunchUrls() {
  const helpUrls = helpCategories.flatMap((category) => [
    `${siteUrl}/help/${category.slug}`,
    ...category.articles.map((article) => `${siteUrl}/help/${category.slug}/${article.slug}`),
  ]);

  return [`${siteUrl}/faq`, `${siteUrl}/help`, ...helpUrls];
}

export async function GET() {
  return NextResponse.json({
    host: new URL(siteUrl).host,
    key: process.env.INDEXNOW_KEY || "",
    keyLocation: process.env.INDEXNOW_KEY ? `${siteUrl}/${process.env.INDEXNOW_KEY}.txt` : "",
    urlList: getLaunchUrls(),
  });
}

export async function POST() {
  return GET();
}
