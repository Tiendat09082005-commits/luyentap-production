const crypto = require('crypto');
const { client, getIsReady, getRedisState } = require('../config/redis');

class CacheService {
  constructor() {
    this.memoryStore = new Map();
    this.inFlightRequests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanupExpiredMemoryEntries(), 60 * 1000);

    if (typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  static normalizePart(part) {
    if (Array.isArray(part)) {
      return part.map((item) => CacheService.normalizePart(item));
    }

    if (part && typeof part === 'object') {
      return Object.keys(part)
        .sort()
        .reduce((accumulator, key) => {
          accumulator[key] = CacheService.normalizePart(part[key]);
          return accumulator;
        }, {});
    }

    return part;
  }

  static hashKey(...parts) {
    const raw = JSON.stringify(parts.map((part) => CacheService.normalizePart(part)));
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  static buildKey(namespace, ...parts) {
    return `${namespace}:${CacheService.hashKey(...parts)}`;
  }

  ensureBackendAvailable() {
    const { allowMemoryFallback } = getRedisState();

    if (getIsReady()) {
      return 'redis';
    }

    if (allowMemoryFallback) {
      return 'memory';
    }

    throw new Error('Cache backend unavailable: Redis is not ready and memory fallback is disabled.');
  }

  cleanupExpiredMemoryEntries() {
    const now = Date.now();

    for (const [key, value] of this.memoryStore.entries()) {
      if (value.expiresAt <= now) {
        this.memoryStore.delete(key);
      }
    }
  }

  async get(key) {
    const backend = this.ensureBackendAvailable();

    if (backend === 'redis') {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    }

    const item = this.memoryStore.get(key);
    if (!item) {
      return null;
    }

    if (item.expiresAt <= Date.now()) {
      this.memoryStore.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key, value, ttl = 300) {
    const backend = this.ensureBackendAvailable();

    if (backend === 'redis') {
      await client.set(key, JSON.stringify(value), { EX: ttl });
      return;
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000
    });
  }

  async getOrSet(key, fetchFn, ttl = 300) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key);
    }

    const fetchPromise = (async () => {
      try {
        const result = await fetchFn();
        await this.set(key, result, ttl);
        return result;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  async invalidateNamespace(namespace) {
    const backend = this.ensureBackendAvailable();

    if (backend === 'redis') {
      const keys = [];

      for await (const key of client.scanIterator({ MATCH: `${namespace}:*`, COUNT: 100 })) {
        keys.push(key);
      }

      if (keys.length > 0) {
        await client.del(keys);
      }

      return;
    }

    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        this.memoryStore.delete(key);
      }
    }
  }

  async invalidateSearchModel(modelName) {
    await Promise.all([
      this.invalidateNamespace(`search:${modelName}`),
      this.invalidateNamespace(`sugg:${modelName}`)
    ]);
  }
}

module.exports = new CacheService();
