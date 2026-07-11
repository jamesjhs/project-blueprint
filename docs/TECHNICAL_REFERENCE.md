# Technical reference

## Server architecture

```text
server/src/
  index.ts
  config.ts
  db.ts
  types.ts
  middleware/
  routes/
  services/
```

## API endpoints included by default

- `GET /api/health`
- `GET /api/version`

### Optional endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/push/vapid-key`
- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`
- `POST /api/push/send`

## Database tables created lazily

- `app_meta`
- `users` when auth is enabled
- `push_subscriptions` when VAPID is enabled

## Environment variables

### Always present

- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `DB_PATH`
- `BASE_URL`

### Optional

- `DB_ENCRYPTION_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
