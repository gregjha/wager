# Wager

Wager is a rec sports meetup app: find a pickup match, pay the entry fee, lock your spot on the roster. Hosts get paid out through Stripe Connect. This repo is a Bun-workspaces monorepo.

## Layout

```
apps/
  web/                # Next.js 16 — App Router, REST /api, Better Auth, Server Actions
  mobile/             # Expo SDK 55 — TanStack Query + REST against web /api
packages/
  domain/             # @bi/domain — server-only match, entry, and payment logic
  payments/           # @bi/payments — Stripe Connect, Checkout, refunds, webhooks (server-only)
  shared/             # @bi/shared — Zod API schemas, DTOs, api-client, query keys
  db/                 # @bi/db — Prisma
  auth/               # @bi/auth — Better Auth
```

REST API contract: [docs/api.md](docs/api.md).

## Working on this repo

```bash
bun install
cp apps/web/.env.example apps/web/.env   # fill in values
bun run --filter @bi/db prisma:migrate:dev
bun run dev                              # web on :3000
bun run stripe:listen                    # forwards webhooks; copy the whsec_ into .env
```

| Command | What it does |
| --- | --- |
| `bun run dev` | Next.js web only (:3000) |
| `bun run build` | web production build |
| `bun run lint` | web lint |
| `bun run prisma-sanity` | validate + generate Prisma artifacts |
| `bun run test:domain` | domain integration tests (needs `DATABASE_URL` pointing at a disposable DB — the tests truncate tables) |

Mobile (separate terminal): `cd apps/mobile && bunx expo start`. See [apps/mobile/README.md](apps/mobile/README.md).

## How entry fees work

1. **Host onboarding.** A host connects a Stripe Express account at `/host/payouts`. Paid matches can't be created until `charges_enabled` and `details_submitted` are true (`account.updated` webhook, with a direct check on return).
2. **Seat hold.** `POST /api/matches/:id/entry` locks the match row (`SELECT … FOR UPDATE`), counts confirmed entries plus unexpired holds, and either confirms (free) or writes a `Pending` entry with `holdExpiresAt` ≈ 31 min and returns a Checkout URL.
3. **Payment.** Checkout is a destination charge: the host receives the fee minus `PLATFORM_FEE_BPS` (5%). Checkout expires just inside the hold window.
4. **Confirmation.** `checkout.session.completed` confirms the seat. If the hold lapsed and the seat was taken, or the match was cancelled meanwhile, the payment is refunded automatically. Events are recorded in `StripeEvent` after success, so failures are retried by Stripe.
5. **Leaving.** Full refund (transfer reversed, platform fee returned) before the match's `refundCutoffHours`; seat released without refund after.
6. **Cancelling.** The host cancels, every paid player is refunded, and open checkouts are expired. Re-running cancel resumes after a partial Stripe failure.

## Stack

- **Web:** Next.js 16, React 19, Tailwind 4, shadcn/radix-ui. RSC + `@bi/domain` for server reads; Server Actions for match create/update/cancel and payout onboarding; TanStack Query for lists and join/leave.
- **Mobile:** Expo SDK 55, TanStack Query, `@bi/shared` api-client. Paid joins use `WebBrowser.openAuthSessionAsync`; `/checkout/return` bounces Stripe's https redirect to `wager://`.
- **Data:** Prisma via `@bi/db`; business logic in `@bi/domain` (server-only).
- **Auth:** Better Auth at `/api/auth/*` (Google, Reddit), Redis secondary storage.
- **Payments:** Stripe Connect Express via `@bi/payments`.

## Deploy

Single Vercel project with **Root Directory** `apps/web`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Session secondary storage |
| `AUTH_SECRET`, `BETTER_AUTH_URL`, OAuth client IDs/secrets | Better Auth |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/webhooks/stripe` |

Create the webhook endpoint at `{origin}/api/webhooks/stripe` with **"Listen to events on Connected accounts" enabled** (needed for `account.updated`) and subscribe to: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `account.updated`, `charge.refunded`.

OAuth redirects: `{origin}/api/auth/callback/google` and `/callback/reddit`.

## Scope note

Entry fees go to the host to cover court time, refs, and gear. Pooling fees into a prize paid to winners turns this into a paid-entry contest, which is regulated state by state and restricted under Stripe's terms — review both before adding winner payouts.
