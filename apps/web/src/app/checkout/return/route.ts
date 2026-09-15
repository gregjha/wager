import { NextResponse } from "next/server";

const MOBILE_SCHEME = "wager://";

/**
 * Stripe only redirects to http(s). Mobile checkouts land here and bounce
 * into the app's deep link so `WebBrowser.openAuthSessionAsync` resolves.
 */
export function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const to = searchParams.get("to");
  const checkout = searchParams.get("checkout") ?? "cancelled";

  if (!to?.startsWith(MOBILE_SCHEME)) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const target = new URL(to);
  target.searchParams.set("checkout", checkout);
  return NextResponse.redirect(target.toString());
}
