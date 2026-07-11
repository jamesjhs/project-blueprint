# Turnstile guide

## Register a site

1. create a Cloudflare Turnstile site
2. record the site key and secret key
3. add them to `.env`

```env
TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

## Server behaviour

When the secret key is missing, verification is bypassed to keep local development simple. When configured, the middleware and auth registration flow verify `cf-turnstile-response` tokens against Cloudflare.

## Client behaviour

Use `TurnstileWidget` in a form and capture the `onVerify(token)` callback so the token can be sent along with the form payload.
