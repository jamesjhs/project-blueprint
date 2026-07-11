# Usage

## Install the scaffolder

```bash
npm install
```

## Run the interactive CLI

```bash
npm run scaffold
```

## Prompt flow

1. enter a kebab-case project name
2. confirm or edit the generated title
3. enter a short project description
4. confirm the initial version
5. choose the server port
6. select `spa` or `server-only`
7. choose optional features by number
8. choose the output directory
9. optionally run `npm install`
10. optionally initialize git

## Force overwriting an existing directory

```bash
npm run scaffold -- --force
```

## Example session

```text
Project name (my-app): task-portal
Project title (Task Portal): Task Portal
Project description (Task Portal application): Internal task dashboard
Initial project version (0.1.0):
Server port (3000): 4100
Project type:
  1) SPA — React + Vite client with Express server API.
  2) Server-only — Express app with static HTML or API only.
Choose a number: 1
Optional features
Selections: 1 2 6
```

## Generated output

The scaffolder copies base files, server files, optional client files, merges selected feature modules, writes `.env.example`, generates the root `package.json`, and performs post-processing for routes and feature wiring.
