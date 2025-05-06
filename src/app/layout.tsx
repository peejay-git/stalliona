import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WalletProvider } from '@/hooks/useWallet';
import AppClientWrapper from '@/components/AppClientWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stallion',
  description: 'A Web3 platform powered by Stellar and Soroban',
  icons: {
    icon: '/logonew.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <AppClientWrapper>
            {children}
          </AppClientWrapper>
        </WalletProvider>
      </body>
    </html>
  );
} 