import { QueryClient } from "@tanstack/react-query";

// Single TanStack Query client for the app. Auth 401s are handled by the axios interceptor
// (silent refresh), so we keep query retries low to avoid hammering on genuine errors, and
// disable refetch-on-focus (this is an admin app, not a live dashboard).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
