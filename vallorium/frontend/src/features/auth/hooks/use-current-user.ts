import { useQuery } from "@tanstack/react-query";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { currentUserQueryKey } from "@/features/auth/auth-query";

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
