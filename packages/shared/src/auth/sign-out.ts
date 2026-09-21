/** Minimal client surface for Better Auth sign-out (keeps @wager/shared free of better-auth). */
export type AuthSignOutClient = {
  signOut: (options?: {
    fetchOptions?: {
      onSuccess?: (context: unknown) => void | Promise<void>;
    };
  }) => Promise<{ error?: { message?: string } | null }>;
};

export type QueryClientLike = {
  clear: () => void;
};

export type SignOutAndClearOptions = {
  onSuccess?: () => void | Promise<void>;
};

/** Sign out via Better Auth, then clear TanStack Query cache (user-scoped lists). */
export async function signOutAndClearQueries(
  authClient: AuthSignOutClient,
  queryClient: QueryClientLike,
  options?: SignOutAndClearOptions,
) {
  return authClient.signOut({
    fetchOptions: {
      onSuccess: async () => {
        queryClient.clear();
        await options?.onSuccess?.();
      },
    },
  });
}
