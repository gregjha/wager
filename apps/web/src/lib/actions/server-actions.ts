"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  createMatchInputSchema,
  updateMatchInputSchema,
  type CreateMatchInput,
  type UpdateMatchInput,
} from "@bi/shared";
import {
  cancelMatchForUser,
  createMatchForUser,
  startHostOnboarding,
  updateMatchForUser,
} from "@bi/domain";

async function authorizedInvariant(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized. Please log in.");
  }

  return session.user.id;
}

export async function createMatch(
  _previousState: string | null,
  data: unknown,
) {
  let matchId: string | null = null;
  try {
    const userId = await authorizedInvariant();
    const input = createMatchInputSchema.parse(data) satisfies CreateMatchInput;
    const match = await createMatchForUser(userId, input);
    matchId = match.id;
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
  }

  redirect(`/match/${matchId!}`);
}

export async function updateMatch(
  _previousState: string | null,
  data: unknown,
) {
  let matchId: string | null = null;

  try {
    const userId = await authorizedInvariant();
    const input = updateMatchInputSchema.parse(data) satisfies UpdateMatchInput;
    const match = await updateMatchForUser(userId, input);
    matchId = match.id;
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
  }

  redirect(`/match/${matchId!}`);
}

export async function cancelMatch(id: string) {
  const userId = await authorizedInvariant();
  await cancelMatchForUser(userId, id);
  redirect(`/match/${id}`);
}

export async function beginPayoutOnboarding() {
  const userId = await authorizedInvariant();
  const url = await startHostOnboarding(userId);
  redirect(url);
}
