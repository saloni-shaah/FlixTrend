import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/utils/redis";

// Max 10 view events per IP per minute
export const viewRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:view:ip",
});

// Max 5 views on the same video per user per minute (farming detection)
export const suspiciousRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:view:uservideo",
});
