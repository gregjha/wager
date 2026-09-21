"use client";

import type React from "react";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { SPORT_LABELS, formatSportLabel } from "@wager/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ANY = "any";

const PRICE_OPTIONS = [
  { value: ANY, label: "Any price" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;

interface MatchFiltersProps {
  className?: string;
}

export function MatchFilters({ className }: MatchFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");

  function pushParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value && value !== ANY) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ search: search.trim(), city: city.trim() });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("grid gap-2 sm:grid-cols-[1fr_12rem_auto_auto_auto]", className)}
    >
      <label className="sr-only" htmlFor="match-search">
        Search matches
      </label>
      <div className="relative">
        <Input
          id="match-search"
          type="text"
          placeholder="Search by name or venue"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card pr-10"
        />
        {search ? (
          <Button
            aria-label="Clear search"
            size="icon"
            variant="ghost"
            type="button"
            className="absolute right-0 top-0"
            onClick={() => setSearch("")}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      <label className="sr-only" htmlFor="match-city">
        City
      </label>
      <Input
        id="match-city"
        type="text"
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="bg-card"
      />
      <Select
        value={searchParams.get("sport") ?? ANY}
        onValueChange={(value) => pushParams({ sport: value })}
      >
        <SelectTrigger className="bg-card sm:w-40" aria-label="Sport">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>All sports</SelectItem>
          {SPORT_LABELS.map((sport) => (
            <SelectItem key={sport} value={sport}>
              {formatSportLabel(sport)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("price") ?? ANY}
        onValueChange={(value) => pushParams({ price: value })}
      >
        <SelectTrigger className="bg-card sm:w-32" aria-label="Price">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRICE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit">
        <Search className="size-4" />
        Search
      </Button>
    </form>
  );
}
