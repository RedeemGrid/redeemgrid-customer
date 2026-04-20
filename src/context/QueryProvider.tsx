import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Global QueryClient with sensible defaults for a PWA.
 * - staleTime 5 min: Data is considered fresh for 5 minutes.
 *   Navigating between pages (e.g., Home <-> Coupons) won't re-fetch.
 * - gcTime 15 min: Data stays in cache for 15 minutes, even when unused.
 *   Users going offline briefly can still access last known data.
 * - retry 1: Fail fast after 1 retry on errors (avoids hammering the API).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      gcTime: 1000 * 60 * 15,     // 15 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Don't re-fetch when user switches tabs
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Export the client so services can invalidate queries (e.g., after claiming a deal)
export { queryClient };
