/**
 * Integration tests for match entry flows against a real Postgres.
 * Stripe is mocked; everything else (locks, capacity, status machine) is real.
 *
 *   DATABASE_URL=... bun test --conditions react-server packages/domain/test
 */
import { beforeEach, describe, expect, it, mock } from "bun:test";

const refunds: string[] = [];
const expired: string[] = [];
let checkoutCounter = 0;

mock.module("@wager/payments", () => ({
  CHECKOUT_HOLD_MINUTES: 30,
  getAppOrigin: () => "http://localhost:3000",
  createEntryCheckoutSession: async () => {
    checkoutCounter += 1;
    return {
      id: `cs_test_${checkoutCounter}`,
      url: `https://checkout.stripe.test/${checkoutCounter}`,
    };
  },
  expireCheckoutSession: async (id: string) => {
    expired.push(id);
  },
  refundEntryPayment: async (pi: string) => {
    refunds.push(pi);
    return `re_${pi}`;
  },
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: async (id: string) => ({
          id,
          status: "open",
          url: `https://checkout.stripe.test/resume/${id}`,
        }),
      },
    },
  }),
  createConnectedAccount: async () => "acct_test",
  createOnboardingLink: async () => "https://connect.stripe.test",
  isAccountPayoutReady: async () => true,
}));

const { prisma } = await import("@wager/db");
const domain = await import("../src/domain");

const inAWeek = () => new Date(Date.now() + 7 * 24 * 3_600_000);

async function makeUser(name: string, payoutsReady = false) {
  return prisma.user.create({
    data: {
      name,
      email: `${name}-${crypto.randomUUID()}@test.dev`,
      stripeAccountId: payoutsReady ? `acct_${crypto.randomUUID()}` : null,
      stripePayoutsReady: payoutsReady,
    },
  });
}

function matchInput(overrides: Partial<Parameters<typeof domain.createMatchForUser>[1]> = {}) {
  return {
    title: "Tuesday 5v5",
    description: "",
    sport: "Basketball" as const,
    skillLevel: "AllLevels" as const,
    startsAt: inAWeek(),
    durationMinutes: 90,
    venueName: "Riverside",
    address: "1 Park Ave",
    city: "New York",
    capacity: 2,
    entryFeeCents: 0,
    refundCutoffHours: 24,
    ...overrides,
  };
}

function checkoutCompleted(eventId: string, entryId: string, sessionId: string, pi: string) {
  return {
    id: eventId,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        payment_status: "paid",
        payment_intent: pi,
        metadata: { entryId },
      },
    },
  } as never;
}

beforeEach(async () => {
  refunds.length = 0;
  expired.length = 0;
  await prisma.$executeRawUnsafe(
    'TRUNCATE "MatchEntry", "Match", "StripeEvent", "User" CASCADE',
  );
});

describe("free matches", () => {
  it("confirms instantly and rejects when full", async () => {
    const host = await makeUser("host");
    const [a, b, c] = await Promise.all(["a", "b", "c"].map((n) => makeUser(n)));
    const { id } = await domain.createMatchForUser(host.id, matchInput());

    expect(await domain.joinMatch(a.id, id)).toEqual({ kind: "confirmed" });
    expect(await domain.joinMatch(b.id, id)).toEqual({ kind: "confirmed" });
    await expect(domain.joinMatch(c.id, id)).rejects.toBeInstanceOf(domain.MatchFullError);
    await expect(domain.joinMatch(a.id, id)).rejects.toBeInstanceOf(domain.ConflictError);
    await expect(domain.joinMatch(host.id, id)).rejects.toThrow("hosting");

    const detail = await domain.getMatchById(id, a.id);
    expect(detail?.spotsTaken).toBe(2);
    expect(detail?.viewerEntryStatus).toBe("Confirmed");
    expect(detail?.roster.map((p) => p.name)).toEqual(["a", "b"]);
  });

  it("never oversells under concurrent joins", async () => {
    const host = await makeUser("host");
    const players = await Promise.all(
      Array.from({ length: 12 }, (_, i) => makeUser(`p${i}`)),
    );
    const { id } = await domain.createMatchForUser(host.id, matchInput({ capacity: 3 }));

    const results = await Promise.allSettled(
      players.map((p) => domain.joinMatch(p.id, id)),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const full = results.filter(
      (r) => r.status === "rejected" && r.reason instanceof domain.MatchFullError,
    ).length;

    expect(ok).toBe(3);
    expect(full).toBe(9);
    expect(
      await prisma.matchEntry.count({ where: { matchId: id, status: "Confirmed" } }),
    ).toBe(3);
  });

  it("leaving frees the seat and re-joining reuses the row", async () => {
    const host = await makeUser("host");
    const [a, b] = await Promise.all([makeUser("a"), makeUser("b")]);
    const { id } = await domain.createMatchForUser(host.id, matchInput({ capacity: 1 }));

    await domain.joinMatch(a.id, id);
    await expect(domain.joinMatch(b.id, id)).rejects.toBeInstanceOf(domain.MatchFullError);
    expect(await domain.leaveMatch(a.id, id)).toEqual({ refunded: false });
    expect(await domain.joinMatch(b.id, id)).toEqual({ kind: "confirmed" });
    await expect(domain.joinMatch(a.id, id)).rejects.toBeInstanceOf(domain.MatchFullError);
    await domain.leaveMatch(b.id, id);
    expect(await domain.joinMatch(a.id, id)).toEqual({ kind: "confirmed" });
    expect(await prisma.matchEntry.count({ where: { matchId: id } })).toBe(2);
  });
});

describe("paid matches", () => {
  it("requires payouts before hosting a paid match", async () => {
    const host = await makeUser("host", false);
    await expect(
      domain.createMatchForUser(host.id, matchInput({ entryFeeCents: 1000 })),
    ).rejects.toBeInstanceOf(domain.PayoutsNotReadyError);
  });

  it("holds a seat during checkout, confirms on webhook, and is idempotent", async () => {
    const host = await makeUser("host", true);
    const [a, b] = await Promise.all([makeUser("a"), makeUser("b")]);
    const { id } = await domain.createMatchForUser(
      host.id,
      matchInput({ entryFeeCents: 1200, capacity: 1 }),
    );

    const res = await domain.joinMatch(a.id, id);
    expect(res.kind).toBe("checkout");

    // The hold occupies the only seat.
    await expect(domain.joinMatch(b.id, id)).rejects.toBeInstanceOf(domain.MatchFullError);
    const pending = await prisma.matchEntry.findUniqueOrThrow({
      where: { matchId_userId: { matchId: id, userId: a.id } },
    });
    expect(pending.status).toBe("Pending");
    expect(pending.amountCents).toBe(1200);

    // Joining again resumes the same checkout instead of creating another.
    const resumed = await domain.joinMatch(a.id, id);
    expect(resumed).toEqual({
      kind: "checkout",
      url: `https://checkout.stripe.test/resume/${pending.stripeCheckoutId}`,
    });

    const event = checkoutCompleted("evt_1", pending.id, pending.stripeCheckoutId!, "pi_1");
    await domain.handleStripeEvent(event);
    await domain.handleStripeEvent(event); // redelivery

    const confirmed = await prisma.matchEntry.findUniqueOrThrow({ where: { id: pending.id } });
    expect(confirmed.status).toBe("Confirmed");
    expect(confirmed.stripePaymentIntentId).toBe("pi_1");
    expect(confirmed.holdExpiresAt).toBeNull();
    expect(await prisma.stripeEvent.count()).toBe(1);
    expect(refunds).toEqual([]);
  });

  it("refunds when leaving before the cutoff, not after", async () => {
    const host = await makeUser("host", true);
    const [early, late] = await Promise.all([makeUser("early"), makeUser("late")]);
    const soon = new Date(Date.now() + 2 * 3_600_000); // inside a 24h cutoff
    const far = await domain.createMatchForUser(host.id, matchInput({ entryFeeCents: 1000 }));
    const near = await domain.createMatchForUser(
      host.id,
      matchInput({ entryFeeCents: 1000, startsAt: soon }),
    );

    for (const [user, matchId, pi] of [
      [early, far.id, "pi_far"],
      [late, near.id, "pi_near"],
    ] as const) {
      await domain.joinMatch(user.id, matchId);
      const entry = await prisma.matchEntry.findUniqueOrThrow({
        where: { matchId_userId: { matchId, userId: user.id } },
      });
      await domain.handleStripeEvent(
        checkoutCompleted(`evt_${pi}`, entry.id, entry.stripeCheckoutId!, pi),
      );
    }

    expect(await domain.leaveMatch(early.id, far.id)).toEqual({ refunded: true });
    expect(await domain.leaveMatch(late.id, near.id)).toEqual({ refunded: false });
    expect(refunds).toEqual(["pi_far"]);

    const statuses = await prisma.matchEntry.findMany({
      select: { status: true, stripeRefundId: true },
      orderBy: { amountCents: "asc" },
    });
    expect(statuses.map((s) => s.status).sort()).toEqual(["Left", "Refunded"]);
  });

  it("refunds a late payment when the lapsed hold's seat was taken", async () => {
    const host = await makeUser("host", true);
    const [slow, fast] = await Promise.all([makeUser("slow"), makeUser("fast")]);
    const { id } = await domain.createMatchForUser(
      host.id,
      matchInput({ entryFeeCents: 500, capacity: 1 }),
    );

    await domain.joinMatch(slow.id, id);
    const slowEntry = await prisma.matchEntry.findUniqueOrThrow({
      where: { matchId_userId: { matchId: id, userId: slow.id } },
    });
    // Simulate the hold lapsing.
    await prisma.matchEntry.update({
      where: { id: slowEntry.id },
      data: { holdExpiresAt: new Date(Date.now() - 1000) },
    });
    expect((await domain.getMatchById(id, slow.id))?.viewerEntryStatus).toBeNull();

    await domain.joinMatch(fast.id, id);
    const fastEntry = await prisma.matchEntry.findUniqueOrThrow({
      where: { matchId_userId: { matchId: id, userId: fast.id } },
    });
    await domain.handleStripeEvent(
      checkoutCompleted("evt_fast", fastEntry.id, fastEntry.stripeCheckoutId!, "pi_fast"),
    );
    await domain.handleStripeEvent(
      checkoutCompleted("evt_slow", slowEntry.id, slowEntry.stripeCheckoutId!, "pi_slow"),
    );

    expect(refunds).toEqual(["pi_slow"]);
    const after = await prisma.matchEntry.findMany({ select: { userId: true, status: true } });
    expect(after.find((e) => e.userId === slow.id)?.status).toBe("Refunded");
    expect(after.find((e) => e.userId === fast.id)?.status).toBe("Confirmed");
  });

  it("expired checkout webhook releases the hold", async () => {
    const host = await makeUser("host", true);
    const [a, b] = await Promise.all([makeUser("a"), makeUser("b")]);
    const { id } = await domain.createMatchForUser(
      host.id,
      matchInput({ entryFeeCents: 500, capacity: 1 }),
    );
    await domain.joinMatch(a.id, id);
    const entry = await prisma.matchEntry.findUniqueOrThrow({
      where: { matchId_userId: { matchId: id, userId: a.id } },
    });
    await domain.handleStripeEvent({
      id: "evt_exp",
      type: "checkout.session.expired",
      data: { object: { id: entry.stripeCheckoutId } },
    } as never);
    expect((await domain.joinMatch(b.id, id)).kind).toBe("checkout");
  });

  it("cancelling refunds confirmed players and closes open checkouts", async () => {
    const host = await makeUser("host", true);
    const [a, b, c] = await Promise.all(["a", "b", "c"].map((n) => makeUser(n)));
    const { id } = await domain.createMatchForUser(
      host.id,
      matchInput({ entryFeeCents: 800, capacity: 5 }),
    );
    for (const [user, pi] of [[a, "pi_a"], [b, "pi_b"]] as const) {
      await domain.joinMatch(user.id, id);
      const entry = await prisma.matchEntry.findUniqueOrThrow({
        where: { matchId_userId: { matchId: id, userId: user.id } },
      });
      await domain.handleStripeEvent(
        checkoutCompleted(`evt_${pi}`, entry.id, entry.stripeCheckoutId!, pi),
      );
    }
    await domain.joinMatch(c.id, id); // still on the checkout page

    await expect(domain.cancelMatchForUser(a.id, id)).rejects.toBeInstanceOf(
      domain.ForbiddenError,
    );
    expect(await domain.cancelMatchForUser(host.id, id)).toEqual({ refundedCount: 2 });
    expect(refunds.sort()).toEqual(["pi_a", "pi_b"]);
    expect(expired).toHaveLength(1);

    await expect(domain.joinMatch(c.id, id)).rejects.toThrow("isn't taking players");
    const list = await domain.listMatches({ viewerUserId: a.id });
    expect(list.edges).toHaveLength(0);
  });
});

describe("hosting rules and listing", () => {
  it("blocks capacity below taken seats and fee changes after joins", async () => {
    const host = await makeUser("host", true);
    const [a, b] = await Promise.all([makeUser("a"), makeUser("b")]);
    const { id } = await domain.createMatchForUser(host.id, matchInput({ capacity: 4 }));
    await domain.joinMatch(a.id, id);
    await domain.joinMatch(b.id, id);

    await expect(
      domain.updateMatchForUser(host.id, { id, capacity: 1 }),
    ).rejects.toThrow("capacity can't go below");
    await expect(
      domain.updateMatchForUser(host.id, { id, entryFeeCents: 500 }),
    ).rejects.toThrow("entry fee can't change");
    await domain.updateMatchForUser(host.id, { id, capacity: 2, title: "Renamed" });
    expect((await domain.getMatchById(id))?.title).toBe("Renamed");
  });

  it("filters, paginates by start time, and lists joined/hosting", async () => {
    const host = await makeUser("host", true);
    const player = await makeUser("player");
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const { id } = await domain.createMatchForUser(
        host.id,
        matchInput({
          title: `Game ${i}`,
          startsAt: new Date(Date.now() + (i + 1) * 3_600_000 * 30),
          sport: i % 2 === 0 ? "Soccer" : "Basketball",
          entryFeeCents: i === 4 ? 1000 : 0,
          city: i === 3 ? "Brooklyn" : "New York",
        }),
      );
      ids.push(id);
    }
    await domain.joinMatch(player.id, ids[1]);

    const page1 = await domain.listMatches({ first: 2 });
    expect(page1.edges.map((e) => e.node.title)).toEqual(["Game 0", "Game 1"]);
    expect(page1.pageInfo.hasNextPage).toBe(true);
    const page2 = await domain.listMatches({ first: 2, after: page1.pageInfo.endCursor });
    expect(page2.edges.map((e) => e.node.title)).toEqual(["Game 2", "Game 3"]);

    expect((await domain.listMatches({ sport: "Soccer" })).edges).toHaveLength(3);
    expect((await domain.listMatches({ price: "paid" })).edges.map((e) => e.node.title)).toEqual(["Game 4"]);
    expect((await domain.listMatches({ city: "brooklyn" })).edges).toHaveLength(1);
    expect((await domain.listMatches({ search: "game 2" })).edges).toHaveLength(1);

    const joined = await domain.listJoinedMatches(player.id, {});
    expect(joined.edges.map((e) => e.node.id)).toEqual([ids[1]]);
    expect(joined.edges[0].node.viewerEntryStatus).toBe("Confirmed");
    expect((await domain.listHostingMatches(host.id, {})).edges).toHaveLength(5);

    await expect(domain.listMatches({ after: "garbage" })).rejects.toThrow("Invalid cursor");
  });
});
