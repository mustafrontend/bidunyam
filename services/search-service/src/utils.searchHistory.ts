import { redisClient } from './redis.client';

export async function saveSearchQuery(userId: string, query: string) {
  const key = `user:search:${userId}`;
  await redisClient.lPush(key, query);
  await redisClient.lTrim(key, 0, 19); // Son 20 arama
}

export async function getRecentSearches(userId: string) {
  const key = `user:search:${userId}`;
  return await redisClient.lRange(key, 0, 19);
}
