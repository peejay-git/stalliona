'use client';

import { WalletProvider } from '@/hooks/useWallet';
import { ReactNode } from 'react';

export default function ClientWalletProvider({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
} 