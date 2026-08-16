import type { QueryClient } from "@tanstack/react-query";

import type { AuthUser } from "@/features/auth/types/auth";

export const currentUserQueryKey = ["auth", "current-user"] as const;

export function cacheCurrentUser(queryClient: QueryClient, user: AuthUser) {
  queryClient.setQueryData(currentUserQueryKey, user);
}
