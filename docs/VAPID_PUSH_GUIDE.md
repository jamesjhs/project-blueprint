# VAPID push guide

## Generate VAPID keys

After scaffolding a project with the `vapid` feature, install dependencies and run a Node snippet or use your preferred tooling to generate a public/private key pair compatible with `web-push`.

Example with Node after install:

```bash
node -e "import('web-push').then(({ default: webpush }) => console.log(webpush.generateVAPIDKeys()))"
```

## Configure the environment

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
```

## Test flow

1. enable PWA support so a service worker is available
2. call the `usePush` hook from a client component
3. subscribe the browser
4. authenticate as an admin user
5. POST to `/api/push/send`
