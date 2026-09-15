# Wager Mobile (Expo)

In the **Wager** monorepo, install and run from the **repository root** with [Bun](https://bun.sh):

```bash
cd /path/to/wager
bun install
cd apps/mobile && bunx expo start
```

## Environment

Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_AUTH_ORIGIN=http://YOUR_LAN_IP:3000
```

On a simulator, `http://127.0.0.1:3000` works.

Mobile calls `{EXPO_PUBLIC_AUTH_ORIGIN}/api/*` for matches and `{EXPO_PUBLIC_AUTH_ORIGIN}/api/auth/*` for Better Auth.

## Paying for a match

Paid joins open Stripe Checkout with `WebBrowser.openAuthSessionAsync`. Stripe only redirects to `https`, so the success/cancel URLs point at the web app's `/checkout/return` route, which redirects to the `wager://` deep link and closes the browser session. The seat is confirmed by the Stripe webhook, not by the redirect.
