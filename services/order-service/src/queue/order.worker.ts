import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { OrderService } from '../services/order.service';

const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379', {
  maxRetriesPerRequest: null,
});

export const startOrderWorker = () => {
  const worker = new Worker(
    'order-queue',
    async (job: Job) => {
      console.log(`[Worker] 📦 Processing order job: ${job.id}`);
      const { userId, orderData } = job.data;
      
      try {
        const order = await OrderService.createOrder(userId, orderData);
        console.log(`[Worker] ✅ Order ${order._id} successfully processed and saved to MongoDB.`);
      } catch (err) {
        console.error(`[Worker] ❌ Failed to process order:`, err);
        throw err; // Re-queue job
      }
    },
    { connection }
  );

  worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed: ${err.message}`));
  
  console.log('[Worker] 🚀 Order Worker is listening for jobs...');
};
