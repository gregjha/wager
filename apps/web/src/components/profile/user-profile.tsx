"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UserProfileTabType } from "@/lib/auth/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  hostingMatchesOptions,
  joinedMatchesOptions,
} from "@/lib/query/hooks/use-matches";
import ProfileHosting from "./profile-hosting";
import ProfileJoined from "./profile-joined";

interface UserProfileProps {
  activeTab: UserProfileTabType;
  user: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const MotionTabsList = motion.create(TabsList);
const MotionTabsTrigger = motion.create(TabsTrigger);

export function UserProfile({ activeTab, user }: Readonly<UserProfileProps>) {
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const tabsListRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const [tabStyles, setTabStyles] = useState({
    x: 0,
    width: 0,
    height: 28,
  });
  const [tab, setTab] = useState<UserProfileTabType>(activeTab);

  useEffect(() => {
    const updateTabStyles = () => {
      const activeTabElement = tabRefs.current[tab];
      if (activeTabElement) {
        setTabStyles({
          x: activeTabElement.offsetLeft,
          width: activeTabElement.offsetWidth,
          height: activeTabElement.offsetHeight,
        });
      }
    };

    updateTabStyles();

    const resizeObserver = new ResizeObserver(updateTabStyles);
    if (tabsListRef.current) {
      resizeObserver.observe(tabsListRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [tab]);

  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const tabParam = url.searchParams.get("tab");
      setTab(tabParam === "hosting" ? "hosting" : "joined");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const onMouseEnter = useCallback(
    (hoveredTab: UserProfileTabType) => {
      void queryClient.prefetchInfiniteQuery(
        hoveredTab === "joined"
          ? joinedMatchesOptions()
          : hostingMatchesOptions(),
      );
    },
    [queryClient],
  );

  const onValueChange = useCallback((value: string) => {
    setTab(value as UserProfileTabType);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
        <Avatar className="size-24">
          <AvatarImage src={user.image || ""} alt={user.name || "User"} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-5xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Tabs
        defaultValue={activeTab}
        value={tab}
        onValueChange={onValueChange}
        className="w-full"
      >
        <MotionTabsList
          ref={tabsListRef}
          layout={true}
          className="relative grid w-full grid-cols-2 z-0"
        >
          <MotionTabsTrigger
            className="cursor-pointer"
            value="joined"
            ref={(el) => {
              tabRefs.current["joined"] = el;
            }}
            onMouseEnter={() => onMouseEnter("joined")}
          >
            Playing
          </MotionTabsTrigger>
          <MotionTabsTrigger
            className="cursor-pointer"
            value="hosting"
            ref={(el) => {
              tabRefs.current["hosting"] = el;
            }}
            onMouseEnter={() => onMouseEnter("hosting")}
          >
            Hosting
          </MotionTabsTrigger>
          <motion.div
            className="absolute left-0 bg-background shadow-sm rounded-md -z-[1]"
            layoutId="active-indicator"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              left: tabStyles.x,
              width: tabStyles.width,
              height: tabStyles.height,
            }}
          />
        </MotionTabsList>
        <TabsContent value="joined" className="space-y-4">
          {tab === "joined" && <ProfileJoined />}
        </TabsContent>
        <TabsContent value="hosting" className="space-y-4">
          {tab === "hosting" && <ProfileHosting />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
