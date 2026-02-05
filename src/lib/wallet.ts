import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils';
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk';
import {
  Networks,
  SwkAppDarkTheme,
} from '@creit-tech/stellar-wallets-kit/types';

if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error('Missing required environment variable NEXT_PUBLIC_APP_URL');
}

if (!process.env.NEXT_PUBLIC_STELLAR_NETWORK) {
  throw new Error(
    'Missing required environment variable NEXT_PUBLIC_STELLAR_NETWORK',
  );
}

let walletKit: StellarWalletsKit | null = null;

export const getWalletKit = () => {
  if (typeof window === 'undefined') {
    // Server-side: return a mock object
    return null;
  }
  if (!walletKit) {
    StellarWalletsKit.init({
      theme: SwkAppDarkTheme,
      network: process.env.NEXT_PUBLIC_STELLAR_NETWORK as Networks,
      modules: defaultModules(),
    });
  }
  return StellarWalletsKit;
};
