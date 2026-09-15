"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { authClient } from "@/lib/auth/auth-client";
import { createMobileQueryClient } from "@/lib/query/get-query-client";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(() => createMobileQueryClient());

  useEffect(() => {
    void authClient.getSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
