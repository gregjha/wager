"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SKILL_LEVEL_LABELS,
  SPORT_LABELS,
  dollarsToCents,
  formatCents,
  formatSkillLevel,
  formatSportLabel,
  matchFormSchema,
  platformFeeCents,
  type MatchDetailDTO,
  type MatchFormData,
  type MatchFormInput,
} from "@wager/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth/auth-client";
import { createMatch, updateMatch } from "@/lib/actions/server-actions";
import { toDateTimeLocalValue } from "@/lib/format/match-time";
import { usePayoutStatus } from "@/lib/query/hooks/use-matches";

interface MatchFormProps {
  initialMatch: MatchDetailDTO | undefined;
  type: "create" | "update";
}

function defaultValues(match: MatchDetailDTO | undefined): MatchFormInput {
  return {
    title: match?.title ?? "",
    description: match?.description ?? "",
    sport: match?.sport ?? "Basketball",
    skillLevel: match?.skillLevel ?? "AllLevels",
    startsAtLocal: match ? toDateTimeLocalValue(match.startsAt) : "",
    durationMinutes: match?.durationMinutes ?? 90,
    venueName: match?.venueName ?? "",
    address: match?.address ?? "",
    city: match?.city ?? "",
    capacity: match?.capacity ?? 10,
    entryFeeDollars: match ? String(match.entryFeeCents / 100) : "",
    refundCutoffHours: match?.refundCutoffHours ?? 24,
  };
}

/** Form values -> server-action payload (`createMatchInputSchema` shape). */
function toServerInput(values: MatchFormData) {
  const { startsAtLocal, entryFeeDollars, ...rest } = values;
  return {
    ...rest,
    startsAt: new Date(startsAtLocal).toISOString(),
    entryFeeCents: dollarsToCents(entryFeeDollars),
  };
}

export function MatchForm({ initialMatch, type }: MatchFormProps) {
  const { data: session } = authClient.useSession();
  const payouts = usePayoutStatus(Boolean(session?.user));
  const [message, action, isSaving] = useActionState(
    type === "create" ? createMatch : updateMatch,
    null,
  );

  const form = useForm<MatchFormInput, unknown, MatchFormData>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: defaultValues(initialMatch),
  });
  const { control, handleSubmit } = form;

  const feeDollars = useWatch({ control, name: "entryFeeDollars" }) ?? "";
  const feeCents = dollarsToCents(feeDollars);
  const isPaid = Number.isFinite(feeCents) && feeCents > 0;
  const needsPayouts = isPaid && payouts.data && !payouts.data.payoutsReady;
  const feeLocked = type === "update" && (initialMatch?.spotsTaken ?? 0) > 0;

  const onSubmit = (values: MatchFormData) => {
    const input = toServerInput(values);
    startTransition(() => {
      action(type === "update" ? { ...input, id: initialMatch!.id } : input);
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <fieldset className="space-y-4" disabled={isSaving}>
              <legend className="mb-2 font-display text-2xl font-bold">
                The game
              </legend>
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Tuesday night 5v5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPORT_LABELS.map((sport) => (
                            <SelectItem key={sport} value={sport}>
                              {formatSportLabel(sport)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill level</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SKILL_LEVEL_LABELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {formatSkillLevel(level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details for players</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Bring a light and a dark shirt. Games to 11, winners stay on."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <fieldset className="space-y-4" disabled={isSaving}>
              <legend className="mb-2 font-display text-2xl font-bold">
                When and where
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="startsAtLocal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="durationMinutes"
                  render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Length (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={String(value)}
                          type="number"
                          min={15}
                          step={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={control}
                name="venueName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Riverside Park, Court 3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <FormField
                  control={control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4" disabled={isSaving}>
              <legend className="mb-2 font-display text-2xl font-bold">
                Spots and entry fee
              </legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={control}
                  name="capacity"
                  render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Players</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={String(value)}
                          type="number"
                          min={2}
                          max={64}
                        />
                      </FormControl>
                      <FormDescription>Not counting you.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="entryFeeDollars"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry fee (USD)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="decimal"
                          placeholder="0 for free"
                          disabled={feeLocked || isSaving}
                        />
                      </FormControl>
                      <FormDescription>
                        {feeLocked
                          ? "Locked once players have joined."
                          : isPaid
                            ? `You receive ${formatCents(feeCents - platformFeeCents(feeCents))} per player after the ${formatCents(platformFeeCents(feeCents))} platform fee.`
                            : "Leave empty for a free match."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="refundCutoffHours"
                  render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Refund window (hours)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={String(value)}
                          type="number"
                          min={0}
                          max={168}
                        />
                      </FormControl>
                      <FormDescription>
                        Players who leave this close to start aren&apos;t
                        refunded.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {needsPayouts ? (
                <p className="rounded-md border-l-4 border-line bg-line/15 px-3 py-2 text-sm">
                  To charge an entry fee, connect a payout account first.{" "}
                  <Link
                    href="/host/payouts"
                    className="font-semibold text-court underline underline-offset-4"
                  >
                    Set up payouts
                  </Link>
                </p>
              ) : null}
            </fieldset>

            {message ? (
              <p role="alert" className="text-sm text-destructive">
                {message}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild={true}>
                <Link href={initialMatch ? `/match/${initialMatch.id}` : "/"}>
                  Discard
                </Link>
              </Button>
              <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? <Spinner /> : null}
                {type === "create" ? "Publish match" : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
