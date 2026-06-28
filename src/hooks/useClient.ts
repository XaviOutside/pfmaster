import { useState, useEffect, useCallback, useRef } from 'react';
import type { Client } from '@/types/client';
import { getClient } from '@/services/client';

interface UseClientState {
  client: Client | null;
  isLoading: boolean;
  error: string | null;
}

export function useClient(id?: number) {
  const [state, setState] = useState<UseClientState>({
    client: null,
    isLoading: !!id,
    error: null,
  });
  const fetchIdRef = useRef(0);

  const fetch = useCallback(async (clientId: number) => {
    const currentId = ++fetchIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await getClient(clientId);
      if (currentId === fetchIdRef.current) {
        setState({
          client: data,
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      if (currentId === fetchIdRef.current) {
        const message =
          err instanceof Error ? err.message : 'Failed to load client';
        setState({
          client: null,
          isLoading: false,
          error: message,
        });
      }
    }
  }, []);

  // Fetch when id changes or on mount
  useEffect(() => {
    if (id !== undefined && id > 0) {
      fetch(id);
    } else {
      setState({ client: null, isLoading: false, error: null });
    }
  }, [id, fetch]);

  return {
    client: state.client,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  };
}
