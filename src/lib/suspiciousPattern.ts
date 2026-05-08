import { redis } from "@/utils/redis";

export async function detectSuspiciousPattern(
  videoId: string,
  userId: string,
  ip: string
): Promise<boolean> {

  // Pattern 1: Same user watching same video too many times in 10 minutes
  const userVideoKey = `suspicious:uv:${userId}:${videoId}`;
  const userVideoCount = await redis.incr(userVideoKey);
  if (userVideoCount === 1) await redis.expire(userVideoKey, 600); // 10 min window
  if (userVideoCount > 3) return true; // same user, same video, 3+ times in 10 min

  // Pattern 2: Same IP hammering many different videos fast
  const ipKey = `suspicious:ip:${ip}`;
  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) await redis.expire(ipKey, 60); // 1 min window
  if (ipCount > 20) return true; // 20+ different view events from same IP in 1 min

  // Pattern 3: Anonymous user (no account) watching too many videos
  if (userId === "anon") {
    const anonKey = `suspicious:anon:${ip}`;
    const anonCount = await redis.incr(anonKey);
    if (anonCount === 1) await redis.expire(anonKey, 300); // 5 min window
    if (anonCount > 10) return true; // anon IP watching 10+ videos in 5 min
  }

  return false;
}
