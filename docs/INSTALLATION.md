# Installation and deployment

## Requirements

- Node.js 20+
- npm 10+
- a Linux host or process manager such as PM2 for production

## Local setup

```bash
cp .env.example .env
npm run install:all
npm run build
```

For SPA projects, run:

```bash
npm run dev:server
npm run dev:client
```

For server-only projects, run:

```bash
npm run dev
```

## Production build

```bash
npm run build
npm run start
```

## PM2 example

```bash
pm2 start npm --name my-app -- run start
pm2 save
```

## Environment checklist

- set `NODE_ENV=production`
- change `JWT_SECRET`
- configure `BASE_URL`
- set any feature-specific keys (VAPID, Turnstile, SMTP, DB encryption)
