const { client, getIsReady, getRedisState } = require('../config/redis');

class RateLimiterService {
  constructor() {
    this.memoryRateMap = new Map();
    this.cleanupInterval = setInterval(() => this.cleanupMemoryWindows(), 60 * 1000);

    if (typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  ensureBackendAvailable() {
    const { allowMemoryFallback } = getRedisState();

    if (getIsReady()) {
      return 'redis';
    }

    if (allowMemoryFallback) {
      return 'memory';
    }

    throw new Error('Rate limiter unavailable: Redis is not ready and memory fallback is disabled.');
  }

  cleanupMemoryWindows() {
    const now = Date.now();

    for (const [key, timestamps] of this.memoryRateMap.entries()) {
      const activeTimestamps = timestamps.filter((timestamp) => timestamp > now - 60 * 1000);

      if (activeTimestamps.length === 0) {
        this.memoryRateMap.delete(key);
      } else {
        this.memoryRateMap.set(key, activeTimestamps);
      }
    }
  }

  async isRateLimited(key, maxRequests = 10, windowSeconds = 1) {
    const backend = this.ensureBackendAvailable();

    if (backend === 'memory') {
      return this.memoryFallback(key, maxRequests, windowSeconds);
    }

    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;

    const multi = client.multi();
    multi.zRemRangeByScore(redisKey, 0, windowStart);
    multi.zAdd(redisKey, [{ score: now, value: member }]);
    multi.zCard(redisKey);
    multi.expire(redisKey, Math.ceil(windowSeconds) + 1);

    const results = await multi.exec();
    const count = Array.isArray(results) ? Number(results[2]) : 0;

    return count > maxRequests;
  }

  memoryFallback(key, maxRequests, windowSeconds) {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const timestamps = this.memoryRateMap.get(key) || [];
    const activeTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    activeTimestamps.push(now);
    this.memoryRateMap.set(key, activeTimestamps);

    return activeTimestamps.length > maxRequests;
  }
}

module.exports = new RateLimiterService();
