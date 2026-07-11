# project-blueprint

`project-blueprint` is a production-ready starter template and interactive scaffolder for James JHS projects. It generates either a full SPA stack (React + Vite client plus Express server) or a server-only Express application, then layers optional capabilities such as PWA support, web push, Turnstile, encrypted SQLite, SMTP, and JWT authentication.

## What this repository contains

- `scripts/scaffold.ts` — interactive CLI built with Node.js built-ins only
- `template/base/` — shared root project files copied into every generated app
- `template/server/` — strict TypeScript Express server template
- `template/client/` — React 19 + Vite 6 + Tailwind CSS v4 SPA template
- `template/features/` — optional feature modules merged into generated projects
- `docs/` — usage, installation, architecture, and feature guides

## Quick start

```bash
npm install
npm run scaffold
```

The CLI will prompt for:

1. project name (`kebab-case`)
2. project title
3. description
4. version
5. server port
6. project type (`spa` or `server-only`)
7. optional features
8. output directory
9. whether to run `npm install`
10. whether to run `git init`

## Token system

Template files use `<<TOKEN>>` placeholders so they stay readable and safe across JSON, TypeScript, JSX, and HTML:

- `<<PROJECT_NAME>>`
- `<<PROJECT_TITLE>>`
- `<<PROJECT_DESCRIPTION>>`
- `<<PROJECT_VERSION>>`
- `<<PORT>>`
- `<<YEAR>>`

The scaffolder copies template files, replaces tokens in text files, skips binary files, generates a dynamic `.env.example`, and then applies feature-specific post-processing.

## Supported project types

### SPA

Creates:

- `client/` — React 19, Vite 6, Tailwind v4
- `server/` — Express API in TypeScript

### Server-only

Creates:

- `server/` — Express app in TypeScript
- `public/` — static HTML shell for simple deployments

## Optional features

| Feature | Adds |
| --- | --- |
| `pwa` | Manifest, service worker, update banner, offline-ready static caching |
| `vapid` | Web push server config, push routes, React subscription hook |
| `turnstile` | Cloudflare Turnstile verification middleware and React widget |
| `sqlitecipher` | Encrypted SQLite via `better-sqlite3-multiple-ciphers` |
| `smtp` | Nodemailer mailer service with retry-aware queue variant |
| `auth-jwt` | JWT auth routes, auth middleware, password hashing |

## Documentation

- [docs/USAGE.md](docs/USAGE.md)
- [docs/FEATURES.md](docs/FEATURES.md)
- [docs/INSTALLATION.md](docs/INSTALLATION.md)
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- [docs/TECHNICAL_REFERENCE.md](docs/TECHNICAL_REFERENCE.md)
- [docs/VAPID_PUSH_GUIDE.md](docs/VAPID_PUSH_GUIDE.md)
- [docs/TURNSTILE_GUIDE.md](docs/TURNSTILE_GUIDE.md)

## Development notes

- The scaffolder intentionally uses only Node.js built-in modules.
- The generated server template is strict TypeScript and includes environment parsing, SQLite setup, middleware, and routes.
- The generated client template follows a lightweight `client/src` structure with version-aware refresh handling.
- PWA assets are provided as template files and copied into either `public/` or `client/public/` depending on project type.
