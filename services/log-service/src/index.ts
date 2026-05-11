import 'dotenv/config';
import Redis from 'ioredis';

// ─── Types ─────────────────────────────────────────────────────
interface UserRegisteredEvent {
  userId: string;
  email: string;
  name: string;
  registeredAt: string;
}

type EventHandler = (payload: unknown) => void;

// ─── Event Registry ────────────────────────────────────────────
const eventHandlers: Record<string, EventHandler> = {
  'user.registered': (payload) => {
    const event = payload as UserRegisteredEvent;
    console.log('\n┌─────────────────────────────────────────────');
    console.log('│ 🎉 NEW USER REGISTERED');
    console.log(`│ ID      : ${event.userId}`);
    console.log(`│ Email   : ${event.email}`);
    console.log(`│ Name    : ${event.name}`);
    console.log(`│ Time    : ${new Date(event.registeredAt).toLocaleString('tr-TR')}`);
    console.log('└─────────────────────────────────────────────\n');
  },
};

// ─── Redis Subscriber ──────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error('[Log] FATAL: REDIS_URL is not configured');
  process.exit(1);
}

const subscriber = new Redis(REDIS_URL, {
  retryStrategy: (times: number) => Math.min(times * 100, 3000),
});

subscriber.on('connect', () => {
  console.log('[Log] ✅ Redis subscriber connected');
});

subscriber.on('error', (err: Error) => {
  console.error('[Log] ❌ Redis error:', err.message);
});

const CHANNELS = Object.keys(eventHandlers);

subscriber.subscribe(...CHANNELS, (err, count) => {
  if (err) {
    console.error('[Log] Failed to subscribe:', err.message);
    process.exit(1);
  }
  console.log(`📋 Log Service listening on ${count} channel(s): [${CHANNELS.join(', ')}]`);
});

subscriber.on('message', (channel: string, message: string) => {
  try {
    const payload = JSON.parse(message) as unknown;
    const handler = eventHandlers[channel];

    if (handler) {
      handler(payload);
    } else {
      console.warn(`[Log] No handler for channel: ${channel}`);
    }
  } catch (err) {
    console.error(`[Log] Failed to parse message on channel "${channel}":`, err);
  }
});

// ─── Graceful Shutdown ─────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('[Log] SIGTERM received, disconnecting...');
  await subscriber.quit();
  process.exit(0);
});

console.log('📋 Log Service starting...');
