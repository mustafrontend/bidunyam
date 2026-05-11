import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL!, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => console.log('[Auth] ✅ Redis connected'));
    redisClient.on('error', (err: Error) => console.error('[Auth] ❌ Redis error:', err.message));
  }

  return redisClient;
};

export const publishEvent = async (channel: string, payload: object): Promise<void> => {
  const client = getRedisClient();
  await client.publish(channel, JSON.stringify(payload));
};
