import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const { user, isInitialized } = useAuthStore();
  const isAuthenticated = useMemo(() => !!user, [user]);
  const loading = !isInitialized;

  return {
    user,
    loading,
    isAuthenticated,
  };
}
