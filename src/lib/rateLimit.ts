import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/utils/redis";

// If Upstash env vars are not provided (local dev), export no-op rate limiters
// that always allow requests. This prevents runtime errors when Redis isn't
// configured in the development environment or preview proxies.
const upstashConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Max 10 view events per IP per minute
export const viewRateLimit = upstashConfigured
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "rl:view:ip",
    })
  : {
      // mimic Ratelimit.limit() API
      async limit() {
        return { success: true };
      },
    } as unknown as Ratelimit;

// Max 5 views on the same video per user per minute (farming detection)
export const suspiciousRateLimit = upstashConfigured
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "rl:view:uservideo",
    })
  : {
      async limit() {
        return { success: true };
      },
    } as unknown as Ratelimit;
