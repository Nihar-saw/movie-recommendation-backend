const redis = require("redis");
let client;

const isRedisEnabled = process.env.REDIS_ENABLED === "true" || !!process.env.REDIS_URL;

if (isRedisEnabled) {
    try {
        client = redis.createClient({
            url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
        });
        client.on("error", err => console.error("Redis Client Error", err));
        client.connect().catch(err => {
            console.warn("Could not connect to Redis, using in-memory fallback.", err.message);
            client = null;
        });
    } catch (err) {
        console.warn("Redis initialization failed, using in-memory fallback.", err.message);
        client = null;
    }
}

// Memory fallback store
const memoryStore = new Map();

const mockClient = {
    get: async (key) => {
        const item = memoryStore.get(key);
        if (!item) return null;
        if (item.expiry && item.expiry < Date.now()) {
            memoryStore.delete(key);
            return null;
        }
        return item.value;
    },
    setEx: async (key, seconds, value) => {
        memoryStore.set(key, {
            value,
            expiry: Date.now() + seconds * 1000
        });
        return "OK";
    },
    connect: async () => {},
    on: () => {}
};

module.exports = {
    get: async (key) => {
        if (client && client.isOpen) {
            try {
                return await client.get(key);
            } catch (err) {
                console.error("Redis get failed, falling back to memory", err);
            }
        }
        return await mockClient.get(key);
    },
    setEx: async (key, seconds, value) => {
        if (client && client.isOpen) {
            try {
                return await client.setEx(key, seconds, value);
            } catch (err) {
                console.error("Redis setEx failed, falling back to memory", err);
            }
        }
        return await mockClient.setEx(key, seconds, value);
    }
};
