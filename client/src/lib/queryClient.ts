import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Throws a useful error when the response is not OK.
 */
async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Standard API request helper.
 * - Deterministic headers (no unions)
 * - Safe for strict TypeScript + fetch overloads
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const headers: HeadersInit = {};

  if (data !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Factory for React Query query functions.
 * Handles 401 behavior explicitly and safely.
 */
export const getQueryFn =
  <T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T | null> =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/"), {
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

/**
 * Centralized QueryClient configuration.
 * Locked for predictable, production-safe behavior.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
