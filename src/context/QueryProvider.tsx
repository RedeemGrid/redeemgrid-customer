import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { ReactNode } from 'react';

/**
 * Global QueryClient with sensible defaults for a PWA.
 * - staleTime 5 min: Data is considered fresh for 5 minutes.
 * - gcTime 24h: Data stays in cache for a long time to enable persistent loads.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours for persistent data
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Persister configuration using localStorage.
 * Sync storage is faster for the initial "instant" render on mobile.
 */
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'RG_QUERY_OFFLINE_CACHE',
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

export { queryClient };
