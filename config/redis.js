const { createClient } = require("redis");

const isProduction = process.env.NODE_ENV === "production";
const allowMemoryFallback =
  process.env.ALLOW_MEMORY_CACHE_FALLBACK === "true" || !isProduction;

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (state === "initializing") {
        return 1000;
      }

      if (!isProduction) {
        return Math.min(retries * 200, 1000);
      }

      return Math.min(retries * 500, 3000);
    },
  },
});

let state = "idle";
let connectPromise = null;

const setState = (nextState) => {
  if (state !== nextState) {
    state = nextState;
    console.log(`[Redis] State changed to ${nextState}`);
  }
};

client.on("connect", () => setState("connecting"));
client.on("ready", () => setState("ready"));
client.on("reconnecting", () => setState("reconnecting"));
client.on("end", () => setState("ended"));
client.on("error", (error) => {
  setState("error");
  console.error("[Redis] Client error:", error.message);
});

const connectRedis = async ({ required = isProduction } = {}) => {
  if (client.isReady) {
    setState("ready");
    return client;
  }

  if (!connectPromise) {
    state = "initializing";
    connectPromise = Promise.race([
      client.connect(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Redis connection timeout after 5 seconds"));
        }, 5000);
      }),
    ]).catch((error) => {
      connectPromise = null;
      setState("error");

      if (client.isOpen) {
        try {
          client.destroy();
        } catch (destroyError) {
          console.warn("[Redis] Destroy failed:", destroyError.message);
        }
      }

      if (required) {
        throw new Error(`Redis connection failed: ${error.message}`);
      }

      console.warn(
        "[Redis] Redis unavailable. Running with explicit memory fallback.",
      );
      return null;
    });
  }

  return connectPromise;
};

const getIsReady = () => client.isReady && state === "ready";

const getRedisState = () => ({
  state,
  isReady: getIsReady(),
  allowMemoryFallback,
});

module.exports = {
  client,
  connectRedis,
  getIsReady,
  getRedisState,
};
