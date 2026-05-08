const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /curl/i, /wget/i, /python/i, /axios/i, /postman/i,
  /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
  /go-http/i, /java\/\d/i, /ruby/i, /perl/i,
  /node-fetch/i, /got\//i, /undici/i, /httpx/i,
];

// Legitimate bots we want to allow (SEO, social previews)
const ALLOWLIST_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /twitterbot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /whatsapp/i,
];

export function detectBot(
  userAgent: string,
  ip: string
): { isBot: boolean; reason?: string } {

  if (!userAgent || userAgent.trim() === "") {
    return { isBot: true, reason: "empty_user_agent" };
  }

  // Allow legitimate crawlers first
  for (const pattern of ALLOWLIST_PATTERNS) {
    if (pattern.test(userAgent)) return { isBot: false };
  }

  if (userAgent.length < 20) {
    return { isBot: true, reason: "ua_too_short" };
  }

  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, reason: `ua_match:${pattern.source}` };
    }
  }

  return { isBot: false };
}
