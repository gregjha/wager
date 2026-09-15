# Wager REST API

Authoritative contract for HTTP routes under `apps/web/src/app/api/`. Mobile and web client islands call these endpoints; RSC pages and Server Actions call `@bi/domain` directly.

## Conventions

| Concern | Convention |
| --- | --- |
| Base path | `/api` (same origin on web; `{EXPO_PUBLIC_AUTH_ORIGIN}/api` on mobile) |
| Auth | Better Auth session cookie (`/api/auth/*`) |
| Mobile headers | `Cookie` (Better Auth session) + `expo-origin` |
| Errors | `{ "error": string, "code"?: string }` |
| IDs | Prisma cuid |
| Money | Integer cents (`entryFeeCents`) plus lowercase ISO `currency` |
| Times | ISO-8601 strings |
| Pagination | `?first=24&after=<cursor>`, ordered by `startsAt` ascending |

### Error codes

| HTTP | `code` | When |
| --- | --- | --- |
| 400 | `INVALID_REQUEST_BODY` / `BAD_REQUEST` | Zod failure, bad JSON, bad cursor |
| 401 | `UNAUTHORIZED` | No session |
| 403 | `FORBIDDEN` | Not the host |
| 404 | `NOT_FOUND` | Match or entry missing |
| 409 | `MATCH_FULL` | No seats left |
| 409 | `PAYOUTS_NOT_READY` | Paid match without a ready Stripe account |
| 409 | `CONFLICT` | Already joined, match started or cancelled, capacity/fee change blocked |

## Pagination

Cursor is base64url JSON: `{ "startsAt": "<ISO8601>", "id": "<cuid>" }`.

```json
{
  "edges": [{ "cursor": "...", "node": { /* MatchDTO */ } }],
  "pageInfo": { "hasNextPage": true, "hasPreviousPage": false, "startCursor": "...", "endCursor": "..." },
  "exists": true
}
```

## MatchDTO

See `matchDtoSchema` in `@bi/shared`. Notable fields:

- `spotsTaken`: confirmed entries plus unexpired checkout holds.
- `viewerEntryStatus`: `"Confirmed" | "Pending" | "Expired" | "Left" | "Refunded" | null`. A lapsed hold reads as `null`.

`MatchDetailDTO` adds `roster: { id, name, image }[]` (confirmed players, in join order).

## Endpoints

### `GET /api/matches`

Public feed of open matches that haven't started.

| Query | Type | Description |
| --- | --- | --- |
| `first` | number (1–100, default 24) | Page size |
| `after` | string | Cursor |
| `search` | string | Title, venue, or description (case-insensitive) |
| `sport` | `Sport` enum | Exact match |
| `city` | string | Case-insensitive exact match |
| `price` | `free` \| `paid` | Fee filter |

**Response:** `MatchConnection`

### `POST /api/matches`

Create a match. **401** without session. Body: `createMatchInputSchema`. **409 `PAYOUTS_NOT_READY`** when `entryFeeCents > 0` and payouts aren't set up.

**Response 201:** `{ "id": string }`

### `GET /api/matches/hosting` · `GET /api/matches/joined`

Authenticated. Hosting returns every match the user hosts (any status). Joined returns matches where the user holds a confirmed seat or an active hold. Query: `first`, `after`.

**Response:** `MatchConnection`

### `GET /api/matches/:id`

**Response:** `MatchDetailDTO` or **404**.

### `PATCH /api/matches/:id`

Host only. Body: partial `updateMatchInputSchema`. Only `Open` matches can be edited. `capacity` can't drop below `spotsTaken`; `entryFeeCents` can't change once anyone has a seat.

**Response:** `{ "id": string }`

### `DELETE /api/matches/:id`

Host only. Soft-cancels (`status: "Cancelled"`), refunds every paid player, expires open checkouts.

**Response:** `{ "refundedCount": number }`

### `POST /api/matches/:id/entry`

Join. Body (optional): `{ "returnUrl"?: string }`. Web passes the current page (must share the app origin); mobile passes a `wager://` URL, which is routed through `/checkout/return`.

**Response 201:** `{ "kind": "confirmed" }` for free matches.
**Response 200:** `{ "kind": "checkout", "url": string }` for paid matches. Calling again during an active hold returns the same session.

The seat is confirmed by the Stripe webhook, never by the redirect.

### `DELETE /api/matches/:id/entry`

Leave. Pending holds are released. Confirmed paid entries are refunded in full before `startsAt - refundCutoffHours`.

**Response:** `{ "refunded": boolean }`

### `GET /api/payouts`

**Response:** `{ "connected": boolean, "payoutsReady": boolean }`

### `POST /api/payouts/onboarding`

Creates the Connect account if needed and returns a single-use onboarding link (mobile opens it in a browser).

**Response:** `{ "url": string }`

### `POST /api/webhooks/stripe`

Stripe only. Verifies `stripe-signature` against the raw body. Returns 400 on bad signature, 500 on handler failure (Stripe retries), 200 otherwise.

### `GET /checkout/return?to=wager://…&checkout=success|cancelled`

Not under `/api`. Redirects to the `wager://` deep link; any other `to` redirects home.
