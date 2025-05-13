import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    // Optional: console.log("Redis client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Redis client despite env vars being set:", error);
    // redis remains null in case of initialization error
  }
} else {
  // Optional: console.warn("Redis environment variables not fully set. Redis client not initialized.");
  // This case is for when one or both env vars are missing.
  // Features requiring Redis may be disabled or work with limitations.
}

export default redis;
