'use client';

import {
  allowAllModules,
  StellarWalletsKit,
  WalletNetwork,
} from '@creit.tech/stellar-wallets-kit';
import { TrezorModule } from '@creit.tech/stellar-wallets-kit/modules/trezor.module';
import {
  WalletConnectAllowedMethods,
  WalletConnectModule,
} from '@creit.tech/stellar-wallets-kit/modules/walletconnect.module';

// Skip initialization on server-side
const isBrowser = typeof window !== 'undefined';

// Ensure environment variables are available
const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
const stellarNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'Testnet';
const trezorEmail = process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL || '';

if (isBrowser) {
  if (!appUrl) {
    console.error('Missing required environment variable NEXT_PUBLIC_APP_URL');
  }

  if (!stellarNetwork) {
    console.error('Missing required environment variable NEXT_PUBLIC_STELLAR_NETWORK');
  }

  if (!trezorEmail) {
    console.error('Missing required environment variable NEXT_PUBLIC_TREZOR_CONTACT_EMAIL');
  }
}

export const kit = isBrowser 
  ? new StellarWalletsKit({
      network:
        stellarNetwork === 'Public'
          ? WalletNetwork.PUBLIC
          : WalletNetwork.TESTNET,
      modules: [
        ...allowAllModules(),
        new TrezorModule({
          appUrl,
          email: trezorEmail,
        }),
        new WalletConnectModule({
          url: appUrl,
          projectId: appUrl,
          method: WalletConnectAllowedMethods.SIGN,
          description:
            'Stallion is a decentralized bounty platform built on the Stellar network',
          name: 'Stallion',
          icons: ['/favicon.svg'],
          network: WalletNetwork.PUBLIC,
        }),
      ],
    })
  : null as unknown as StellarWalletsKit; // Type assertion for server-side rendering
