# FuelFinder — Local development

FuelFinder no longer requires Replit. The repository is a pnpm workspace containing the web app, API libraries and Expo mobile app.

## Fedora prerequisites

Install Node.js 20+ and pnpm, then from the repository root:

```bash
corepack enable
pnpm install
pnpm typecheck
```

## Mobile app

```bash
cd artifacts/portugal-fuel-finder-mobile
pnpm start
```

Use Expo Go for early device testing. Production Android/iOS builds should use EAS Build later in the release process.

## Web app

```bash
cd artifacts/portugal-fuel-finder
pnpm dev
```

The Vite development server now defaults to port 5173 and `/` when `PORT` and `BASE_PATH` are not supplied.

## Environment and backend

Keep secrets out of Git. Use local `.env` files (already ignored where applicable) and production environment variables on the eventual hosting provider. Do not delete the existing Replit deployment until the independent database/API deployment has been verified.
