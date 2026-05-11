import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379', {
  maxRetriesPerRequest: null,
});

export const orderQueue = new Queue('order-queue', { connection });

export const addOrderToQueue = async (orderData: any) => {
  await orderQueue.add('process-order', orderData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};
