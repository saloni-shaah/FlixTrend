import { faqCategories } from "@/data/faq";
import { helpCategories } from "@/data/help";

const DEFAULT_SITE_URL = "https://flixtrend.in";

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export const siteUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
);

function uniqueUrls(urls: string[]) {
  return [...new Set(urls.filter(Boolean))];
}

export function getStaticSeoPaths() {
  return [
    "/",
    "/about",
    "/contact",
    "/faq",
    "/help",
    "/privacy",
    "/terms",
    "/premium",
    "/store",
    "/flix",
    "/vibespace",
    "/squad",
    "/squad/explore",
    "/drop",
  ];
}

export function getHelpSeoPaths() {
  return helpCategories.flatMap((category) => [
    `/help/${category.slug}`,
    ...category.articles.map((article) => `/help/${category.slug}/${article.slug}`),
  ]);
}

export function getFaqSeoPaths() {
  return faqCategories.length ? ["/faq"] : [];
}

export function getSeoUrls(paths: string[]) {
  return uniqueUrls(paths.map((path) => `${siteUrl}${path}`));
}

export function getLaunchSeoUrls() {
  return getSeoUrls([
    ...getStaticSeoPaths(),
    ...getHelpSeoPaths(),
    ...getFaqSeoPaths(),
  ]);
}
