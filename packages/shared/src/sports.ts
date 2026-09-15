import { z } from "zod";

export const sportSchema = z.enum([
  "Basketball",
  "Soccer",
  "Volleyball",
  "Pickleball",
  "Tennis",
  "Softball",
  "Football",
  "UltimateFrisbee",
  "Hockey",
  "Kickball",
]);

export type SportLabel = z.infer<typeof sportSchema>;

/** Canonical sport values (matches Prisma `Sport` enum). */
export const SPORT_LABELS = sportSchema.options;

const SPORT_DISPLAY_LABELS: Record<SportLabel, string> = {
  Basketball: "Basketball",
  Soccer: "Soccer",
  Volleyball: "Volleyball",
  Pickleball: "Pickleball",
  Tennis: "Tennis",
  Softball: "Softball",
  Football: "Flag football",
  UltimateFrisbee: "Ultimate",
  Hockey: "Hockey",
  Kickball: "Kickball",
};

export function formatSportLabel(sport: SportLabel): string {
  return SPORT_DISPLAY_LABELS[sport];
}

export const skillLevelSchema = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
  "AllLevels",
]);

export type SkillLevelLabel = z.infer<typeof skillLevelSchema>;

export const SKILL_LEVEL_LABELS = skillLevelSchema.options;

export function formatSkillLevel(level: SkillLevelLabel): string {
  return level === "AllLevels" ? "All levels" : level;
}

export const matchStatusSchema = z.enum(["Open", "Cancelled", "Completed"]);
export type MatchStatusLabel = z.infer<typeof matchStatusSchema>;

export const entryStatusSchema = z.enum([
  "Pending",
  "Confirmed",
  "Expired",
  "Left",
  "Refunded",
]);
export type EntryStatusLabel = z.infer<typeof entryStatusSchema>;
