# CI/CD Setup Guide

This guide explains how to set up the CI/CD pipeline for SkateHubba.

## Required GitHub Secrets

Add these secrets in your repo: **Settings > Secrets and variables > Actions**

### Web Build (Required)

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Firebase Console > Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Firebase Console > Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Firebase Console > Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Firebase Console > Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | Firebase Console > Project Settings |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Firebase Console > Project Settings |
| `VITE_API_URL` | Your API endpoint | Your server URL (e.g., `https://api.skatehubba.com`) |

### Mobile Build (Required for EAS)

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `EXPO_TOKEN` | Expo access token | [expo.dev](https://expo.dev) > Account Settings > Access Tokens |

### Vercel Deploy (Required for auto-deploy)

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `VERCEL_TOKEN` | Vercel API token | [vercel.com](https://vercel.com) > Settings > Tokens |
| `VERCEL_ORG_ID` | Your team/org ID | `.vercel/project.json` or Vercel dashboard |
| `VERCEL_PROJECT_ID` | Project ID | `.vercel/project.json` or Vercel dashboard |

### Security (Optional but recommended)

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `GITLEAKS_LICENSE` | Gitleaks license key | [gitleaks.io](https://gitleaks.io) |
| `FIREBASE_TOKEN` | Firebase CLI token | Run `firebase login:ci` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Firebase Console > Project Settings |

---

## EAS Setup (One-time)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure your project** (run from `/mobile`):
   ```bash
   eas build:configure
   ```

4. **Update credentials** in `mobile/eas.json`:
   - For iOS: Add your Apple Developer credentials in the `submit.production.ios` section
   - For Android: Add your Google Play service account in `submit.production.android`

---

## Workflow Behavior

| Trigger | validate | build-web | build-mobile | deploy-web |
|---------|----------|-----------|--------------|------------|
| PR to main | Yes | Yes | Yes | No |
| Push to main | Yes | Yes | Yes | Yes |

### Job Dependencies

```
security ─────────────────────────────────────┐
                                              │
validate ─────┬── build-web ──── deploy-web   │
              │                               │
              └── build-mobile ───────────────┘
```

- `security` runs in parallel (independent)
- `validate` runs first (typecheck, lint, test)
- `build-web` and `build-mobile` run **in parallel** after validation passes
- `deploy-web` only triggers on pushes to main branch

---

## Build Minutes Warning

**EAS Build uses Expo's build servers:**

- Free tier: 15 iOS + 15 Android builds/month
- `--no-wait` flag queues the build without blocking CI
- Preview builds are internal distribution (no App Store review)

To save build minutes during development, you can temporarily disable the `build-mobile` job by commenting it out in `.github/workflows/ci.yml`.

---

## Local Testing

### Test the CI workflow locally:

```bash
# Install dependencies
pnpm install

# Run validation steps
pnpm run typecheck
pnpm run lint
pnpm vitest run

# Build web
pnpm --filter skatehubba-client build
```

### Test EAS build locally:

```bash
cd mobile

# Build for development
eas build --platform ios --profile development --local
eas build --platform android --profile development --local

# Build for preview (what CI does)
eas build --platform all --profile preview --local
```

---

## Troubleshooting

### Build fails with "Missing env var"

Make sure all required secrets are set in GitHub. The Firebase config has fallback values for local development, but CI requires the secrets to be set.

### EAS build fails with authentication error

1. Generate a new Expo token at [expo.dev](https://expo.dev)
2. Update the `EXPO_TOKEN` secret in GitHub

### Vercel deploy fails

1. Check that `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are set correctly
2. Make sure the Vercel project exists and is linked to this repository

### Firebase rules validation fails

1. Check that `FIREBASE_TOKEN` is set
2. Run `firebase login:ci` to generate a new token if needed

---

## Security Notes

1. **Never commit secrets** to the repository
2. **Firebase API keys** are safe to expose in client code (security is enforced via Firebase Rules)
3. **Server secrets** (DATABASE_URL, JWT_SECRET, etc.) must never be in client code
4. **Rotate secrets** periodically and after any suspected breach
