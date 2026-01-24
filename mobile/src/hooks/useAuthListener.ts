import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function useAuthListener() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialize]);
}
