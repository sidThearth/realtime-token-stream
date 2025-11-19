import redis from '../config/redis';
import logger from '../utils/logger';

export class CacheService {
    private static instance: CacheService;
    private defaultTTL = 30; // 30 seconds
    private useRedis = true;
    private memoryCache = new Map<string, { value: any; expiry: number }>();

    private constructor() {
        redis.on('error', (err) => {
            if (this.useRedis) {
                logger.warn('Redis connection failed, switching to in-memory cache.');
                this.useRedis = false;
            }
        });

        redis.on('connect', () => {
            if (!this.useRedis) {
                logger.info('Redis connected, switching back to Redis cache.');
                this.useRedis = true;
            }
        });
    }

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.useRedis) {
            const item = this.memoryCache.get(key);
            if (!item) return null;
            if (Date.now() > item.expiry) {
                this.memoryCache.delete(key);
                return null;
            }
            return item.value as T;
        }

        try {
            const data = await redis.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            // If a single request fails, fallback to memory for this request and potentially switch mode
            logger.warn(`Cache get error, falling back to memory: ${error}`);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
        if (!this.useRedis) {
            this.memoryCache.set(key, {
                value,
                expiry: Date.now() + (ttl * 1000)
            });
            return;
        }

        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (error) {
            logger.warn(`Cache set error, falling back to memory: ${error}`);
            // Fallback set
            this.memoryCache.set(key, {
                value,
                expiry: Date.now() + (ttl * 1000)
            });
        }
    }

    async del(key: string): Promise<void> {
        if (!this.useRedis) {
            this.memoryCache.delete(key);
            return;
        }

        try {
            await redis.del(key);
        } catch (error) {
            logger.warn(`Cache del error: ${error}`);
            this.memoryCache.delete(key);
        }
    }
}
