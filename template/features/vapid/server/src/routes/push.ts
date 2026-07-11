import { Router } from 'express';
import webpush, { type PushSubscription } from 'web-push';
import db from '../db';
import { VAPID } from '../config';
import { requireAuth } from '../middleware/auth';

const router = Router();

db.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    endpoint TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertSubscription = db.prepare(
  'INSERT OR REPLACE INTO push_subscriptions (endpoint, payload) VALUES (?, ?)',
);
const removeSubscription = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?');
const allSubscriptions = db.prepare('SELECT payload FROM push_subscriptions');

router.get('/vapid-key', (_req, res) => {
  if (!VAPID.publicKey) {
    res.status(404).json({ error: 'VAPID public key is not configured' });
    return;
  }

  res.json({ publicKey: VAPID.publicKey });
});

router.post('/subscribe', (req, res) => {
  const subscription = req.body as PushSubscription | undefined;
  if (!subscription?.endpoint) {
    res.status(400).json({ error: 'A valid push subscription is required' });
    return;
  }

  insertSubscription.run(subscription.endpoint, JSON.stringify(subscription));
  res.status(201).json({ success: true });
});

router.post('/unsubscribe', (req, res) => {
  const endpoint = req.body?.endpoint as string | undefined;
  if (!endpoint) {
    res.status(400).json({ error: 'Subscription endpoint is required' });
    return;
  }

  removeSubscription.run(endpoint);
  res.json({ success: true });
});

router.post('/send', requireAuth, async (req, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin role required' });
    return;
  }

  const title = req.body?.title ?? '<<PROJECT_TITLE>>';
  const body = req.body?.body ?? 'New notification';
  const url = req.body?.url ?? '/';

  const rows = allSubscriptions.all() as Array<{ payload: string }>;
  await Promise.all(
    rows.map(async ({ payload }) => {
      const subscription = JSON.parse(payload) as PushSubscription;
      try {
        await webpush.sendNotification(subscription, JSON.stringify({ title, body, url }));
      } catch (error) {
        const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error ? Number((error as { statusCode: unknown }).statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          removeSubscription.run(subscription.endpoint);
        }
      }
    }),
  );

  res.json({ success: true, sent: rows.length });
});

export default router;
