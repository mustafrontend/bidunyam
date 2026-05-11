import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL!, {
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      lazyConnect: true,
    });

    redisClient.on('connect', () => console.log('[Cart] 🛒 Redis connected'));
    redisClient.on('error', (err: Error) => console.error('[Cart] ❌ Redis error:', err.message));
  }

  return redisClient;
};
