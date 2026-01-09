'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { tokenStorage } from './api';

/**
 * Hook to sync NextAuth session's access token with the API client's token storage.
 * Use this in your layout or providers to keep the API client authenticated.
 */
export function useAuthSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      // Sync the access token to localStorage for API client
      tokenStorage.setToken(session.accessToken);
    } else if (status === 'unauthenticated') {
      // Clear token when logged out
      tokenStorage.removeToken();
    }
  }, [session, status]);

  return { session, status };
}

