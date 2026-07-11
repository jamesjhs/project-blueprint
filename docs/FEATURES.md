# Features

| Key | Description | Server changes | Client changes |
| --- | --- | --- | --- |
| `pwa` | Progressive Web App support | Server-only apps serve `sw.js` and `manifest.json` | Adds manifest, service worker assets, refresh flow |
| `vapid` | Web push notifications | Adds VAPID config and push routes | Adds `usePush` hook |
| `turnstile` | Cloudflare CAPTCHA | Adds verification middleware | Adds reusable widget component |
| `sqlitecipher` | Encrypted SQLite | Adds encryption env support and migration helper | None |
| `smtp` | Outbound email | Replaces base mailer with queued retry implementation | None |
| `auth-jwt` | JWT auth flows | Adds register/login/me/logout routes | Ready for future auth UI wiring |

## Dependency notes

- `web-push` is added to the generated server package when `vapid` is selected.
- `better-sqlite3-multiple-ciphers` is always present in the server template and supports both plaintext and encrypted SQLite usage.
- `nodemailer` remains available in the base server template, while the `smtp` feature upgrades the implementation.
