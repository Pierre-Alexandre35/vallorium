import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { logout } from "@/features/auth/api/logout";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Remove all cached user-scoped server data before another user can sign in.
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });

  return {
    signOut: mutation.mutate,
    isSigningOut: mutation.isPending,
    signOutError: mutation.error,
    resetSignOut: mutation.reset,
  };
}
