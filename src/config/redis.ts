import Redis from 'ioredis';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redis.on('connect', () => {
    logger.info('Connected to Redis');
});

redis.on('error', (err) => {
    // Suppress connection errors as they are handled in CacheService
    // logger.error('Redis connection error:', err);
});

export default redis;
