import "server-only";

export type MatchCursorPayload = {
  startsAt: string;
  id: string;
};

export function encodeMatchCursor(payload: MatchCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeMatchCursor(cursor: string): MatchCursorPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid cursor");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as Record<string, unknown>).startsAt !== "string" ||
    typeof (parsed as Record<string, unknown>).id !== "string"
  ) {
    throw new Error("Invalid cursor");
  }

  return parsed as MatchCursorPayload;
}
