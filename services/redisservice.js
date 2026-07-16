const Redis = require("ioredis");
const logger = require("./logger");

let redisClient = null;
let isRedisAvailable = false;

// Initialize Redis only if not running in test mode
const isTest = process.env.NODE_ENV === "test";

if (!isTest) {
    try {
        const redisUrl =
            process.env.REDIS_URL || "redis://127.0.0.1:6379";

        logger.info(
            `Connecting to Redis at ${redisUrl.replace(/:[^:@]+@/, ":***@")}...`
        );

        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            connectTimeout: 5000,
            retryStrategy(times) {
                if (times > 3) {
                    if (isRedisAvailable) {
                        logger.warn(
                            "Redis connection attempts exhausted. Switching to Database fallback."
                        );
                        isRedisAvailable = false;
                    }
                    return 5000;
                }

                return Math.min(times * 500, 2000);
            },
        });

        redisClient.on("connect", () => {
            logger.info("Redis connection initiated.");
        });

        redisClient.on("ready", () => {
            logger.info("Redis client is ready and caching is active.");
            isRedisAvailable = true;
        });

        redisClient.on("error", (err) => {
            if (isRedisAvailable) {
                logger.warn(
                    `Redis client error encountered: ${err.message}. Graceful fallback active.`
                );
                isRedisAvailable = false;
            }
        });

        redisClient.on("end", () => {
            if (isRedisAvailable) {
                logger.warn("Redis client connection closed.");
                isRedisAvailable = false;
            }
        });
    } catch (err) {
        logger.error(
            `Failed to initialize Redis client: ${err.message}`
        );
        isRedisAvailable = false;
    }
}

// Get Cache
async function getCache(key) {
    if (!isRedisAvailable || !redisClient) return null;

    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        logger.warn(
            `Redis getCache error for key "${key}": ${err.message}`
        );
        return null;
    }
}

// Set Cache
async function setCache(key, value, ttlSeconds) {
    if (!isRedisAvailable || !redisClient) return false;

    try {
        const stringified = JSON.stringify(value);

        await redisClient.set(key, stringified, "EX", ttlSeconds);

        return true;
    } catch (err) {
        logger.warn(
            `Redis setCache error for key "${key}": ${err.message}`
        );
        return false;
    }
}

// Delete Cache
async function deleteCache(key) {
    if (!isRedisAvailable || !redisClient) return false;

    try {
        await redisClient.del(key);
        return true;
    } catch (err) {
        logger.warn(
            `Redis deleteCache error for key "${key}": ${err.message}`
        );
        return false;
    }
}

// Delete Multiple Cache by Pattern
async function invalidatePattern(pattern) {
    if (!isRedisAvailable || !redisClient) return false;

    try {
        logger.info(`Invalidating Redis cache pattern: "${pattern}"`);

        const keys = await redisClient.keys(pattern);

        if (keys.length > 0) {
            logger.info(`Found ${keys.length} keys to delete.`);
            await redisClient.del(...keys);
        }

        return true;
    } catch (err) {
        logger.warn(
            `Redis invalidatePattern error for pattern "${pattern}": ${err.message}`
        );
        return false;
    }
}

// Check Redis Status
function isCacheAvailable() {
    return isRedisAvailable;
}

module.exports = {
    getCache,
    setCache,
    deleteCache,
    invalidatePattern,
    isCacheAvailable,
};