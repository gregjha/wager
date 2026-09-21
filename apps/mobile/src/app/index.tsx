import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatCents,
  formatSkillLevel,
  formatSportLabel,
  type MatchDTO,
} from "@wager/shared";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  BrandColors,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { authClient } from "@/lib/auth/auth-client";
import {
  useJoinMatch,
  useMatches,
  type MobileJoinOutcome,
} from "@/lib/query/hooks/use-matches";

const startFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const OUTCOME_MESSAGES: Record<MobileJoinOutcome, string> = {
  confirmed: "You're on the roster.",
  paid: "Payment received. Your spot confirms in a few seconds.",
  cancelled: "Checkout closed before paying. Your spot is held briefly.",
};

export default function MatchesScreen() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMatches();

  const matches =
    data?.pages.flatMap((page) => page.edges.map((edge) => edge.node)) ?? [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Next up
        </ThemedText>

        {isLoading && matches.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <ThemedText type="small">{error.message}</ThemedText>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={matches}
            keyExtractor={(match) => match.id}
            renderItem={({ item }) => <MatchRow match={item} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <ThemedText type="small" style={styles.empty}>
                No upcoming matches yet. Host one from the web app.
              </ThemedText>
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function MatchRow({ match }: { match: MatchDTO }) {
  const { data: session } = authClient.useSession();
  const join = useJoinMatch();
  const [outcome, setOutcome] = useState<MobileJoinOutcome | null>(null);

  const open = Math.max(match.capacity - match.spotsTaken, 0);
  const price = formatCents(match.entryFeeCents, match.currency);
  const isHost = session?.user?.id === match.host.id;
  const joined = match.viewerEntryStatus === "Confirmed";
  const canJoin = Boolean(session?.user) && !isHost && !joined && open > 0;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.stub}>
          <ThemedText style={styles.stubText}>
            {startFormat.format(new Date(match.startsAt))}
          </ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.price}>
          {price}
        </ThemedText>
      </View>
      <ThemedText style={styles.sport}>
        {formatSportLabel(match.sport)}, {formatSkillLevel(match.skillLevel).toLowerCase()}
      </ThemedText>
      <ThemedText type="subtitle">{match.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {match.venueName}, {match.city}
      </ThemedText>
      <ThemedText type="small">
        {open === 0 ? "Full" : `${open} of ${match.capacity} spots left`}
      </ThemedText>

      {joined ? (
        <ThemedText type="smallBold" style={styles.joined}>
          {"You're in"}
        </ThemedText>
      ) : canJoin ? (
        <Pressable
          accessibilityRole="button"
          disabled={join.isPending}
          onPress={() => {
            setOutcome(null);
            join.mutate(match.id, { onSuccess: setOutcome });
          }}
          style={({ pressed }) => [
            styles.button,
            (pressed || join.isPending) && styles.pressed,
          ]}
        >
          {join.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.buttonText}>
              {match.entryFeeCents > 0 ? `Pay ${price} and join` : "Join match"}
            </ThemedText>
          )}
        </Pressable>
      ) : !session?.user ? (
        <ThemedText type="small" themeColor="textSecondary">
          Sign in on the Account tab to join.
        </ThemedText>
      ) : null}

      {outcome ? <ThemedText type="small">{OUTCOME_MESSAGES[outcome]}</ThemedText> : null}
      {join.error ? (
        <ThemedText type="small" style={styles.error}>
          {join.error.message}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    width: "100%",
  },
  title: {
    paddingVertical: Spacing.three,
  },
  list: {
    flex: 1,
    alignSelf: "stretch",
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.one,
  },
  stub: {
    backgroundColor: BrandColors.asphalt,
    borderBottomWidth: 3,
    borderBottomColor: BrandColors.line,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  stubText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  price: {
    fontVariant: ["tabular-nums"],
  },
  sport: {
    color: BrandColors.court,
    fontWeight: "600",
  },
  joined: {
    color: BrandColors.turf,
    marginTop: Spacing.two,
  },
  button: {
    marginTop: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: Spacing.two,
    backgroundColor: BrandColors.court,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
  error: {
    color: "#c2412d",
  },
  empty: {
    textAlign: "center",
    paddingVertical: Spacing.five,
  },
  separator: {
    height: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
