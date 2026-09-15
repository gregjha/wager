"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOutAndClearQueries } from "@bi/shared";
import { useQueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Landmark, LogOut, Plus, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, startTransition] = useTransition();

  if (isPending) {
    return <Skeleton className="size-10 rounded-full bg-white/15" />;
  }

  if (!session?.user) {
    return (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 hover:text-white"
          asChild={true}
        >
          <Link href="/login">Sign in</Link>
        </Button>
        <Button
          size="sm"
          className="bg-line text-asphalt hover:bg-line/85"
          asChild={true}
        >
          <Link href="/register">Sign up</Link>
        </Button>
      </div>
    );
  }

  const user = session.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={true}>
        <Button
          variant="ghost"
          className="relative size-10 rounded-full hover:bg-white/10"
        >
          <Avatar className="size-10">
            <AvatarImage src={user?.image ?? ""} alt={user?.name ?? "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild={true}>
          <Link
            href="/profile"
            className="flex w-full cursor-pointer items-center"
          >
            <User className="mr-2 size-4" />
            My matches
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild={true}>
          <Link
            href="/match/new"
            className="flex w-full cursor-pointer items-center"
          >
            <Plus className="mr-2 size-4" />
            Host a match
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild={true}>
          <Link
            href="/host/payouts"
            className="flex w-full cursor-pointer items-center"
          >
            <Landmark className="mr-2 size-4" />
            Payouts
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={isSigningOut}
          onClick={() =>
            startTransition(async () => {
              await signOutAndClearQueries(authClient, queryClient, {
                onSuccess: () => {
                  router.push("/");
                },
              });
            })
          }
        >
          <LogOut className="mr-2 size-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
