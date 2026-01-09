'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { useAuthSync } from '@/lib/useAuthSync';

function AuthSyncWrapper({ children }: { children: ReactNode }) {
  useAuthSync();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSyncWrapper>{children}</AuthSyncWrapper>
    </SessionProvider>
  );
}

