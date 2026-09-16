import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { signOutAndClearQueries } from "@bi/shared";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth/auth-client";
import {
  useSocialSignIn,
  type SocialSignInStatus,
} from "@/lib/auth/social-sign-in";

export default function AccountScreen() {
  const { data, isPending } = authClient.useSession();
  const google = useSocialSignIn("google");

  const signedIn = Boolean(data?.session);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Account
        </ThemedText>

        {isPending ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : signedIn ? (
          <SignedInPanel user={data?.user} />
        ) : (
          <SignedOutPanel
            providers={[{ label: "Google", ...google }]}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function SignedInPanel({
  user,
}: {
  user: { name?: string | null; email?: string | null } | undefined;
}) {
  const queryClient = useQueryClient();
  const displayName = user?.name ?? user?.email;

  async function handleSignOut() {
    await signOutAndClearQueries(authClient, queryClient);
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="subtitle">
        {displayName ? `Signed in as ${displayName}` : "You're signed in"}
      </ThemedText>
      <ThemedText type="small">
        Your Better Auth session cookie is stored on device and sent to the
        web app REST API.
      </ThemedText>
      <Pressable
        onPress={() => {
          void handleSignOut();
        }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <ThemedText type="link">Sign out</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

interface ProviderSignIn {
  status: SocialSignInStatus;
  error: string | null;
  signIn: () => Promise<void>;
  label: string;
}

interface SignedOutPanelProps {
  providers: ProviderSignIn[];
}

function SignedOutPanel({ providers }: SignedOutPanelProps) {
  const anyBusy = providers.some((p) => p.status === "busy");
  const unconfigured = providers.every((p) => p.status === "unconfigured");
  const error = providers.map((p) => p.error).find(Boolean) ?? null;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="subtitle">Sign in</ThemedText>
      <ThemedText type="small">
        Sign in with Google to join matches from your phone.
      </ThemedText>

      {providers.map((provider) => {
        const disabled =
          anyBusy ||
          provider.status === "unconfigured" ||
          unconfigured;
        const busy = provider.status === "busy";

        return (
          <Pressable
            key={provider.label}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => {
              void provider.signIn();
            }}
            style={({ pressed }) => [
              styles.button,
              (pressed || busy) && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator />
            ) : (
              <ThemedText type="link">
                {unconfigured
                  ? `${provider.label} sign-in unavailable`
                  : `Continue with ${provider.label}`}
              </ThemedText>
            )}
          </Pressable>
        );
      })}

      {error ? (
        <ThemedText type="small" themeColor="textSecondary">
          {error}
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
    textAlign: "center",
    paddingVertical: Spacing.three,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
