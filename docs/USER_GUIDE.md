# Generated project user guide

Use this guide as a starting point inside a scaffolded project.

## Application overview

- `server/` hosts the Express backend
- `client/` hosts the React SPA when selected
- `public/` contains static assets for server-only apps and PWA files

## Common tasks

### Change the port

Update `PORT` in `.env`.

### Add routes

Create files under `server/src/routes/` and mount them from `server/src/index.ts` or `server/src/routes/index.ts`.

### Update branding

Edit the client header, the root README, and the PWA manifest if enabled.

### Work with the database

Use `server/src/db.ts` for all SQLite access and keep schema bootstrap close to route or service modules.
