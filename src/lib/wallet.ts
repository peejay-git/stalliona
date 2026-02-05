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

if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error('Missing required environment variable NEXT_PUBLIC_APP_URL');
}

if (!process.env.NEXT_PUBLIC_STELLAR_NETWORK) {
  throw new Error(
    'Missing required environment variable NEXT_PUBLIC_STELLAR_NETWORK',
  );
}

if (!process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL) {
  throw new Error(
    'Missing required environment variable NEXT_PUBLIC_TREZOR_CONTACT_EMAIL',
  );
}

// Initialize wallet kit only in browser environment
let kit: StellarWalletsKit | null = null;

const initKit = () => {
  if (typeof window === 'undefined') {
    // Server-side: return a mock object
    return null;
  }

  if (!kit) {
    kit = new StellarWalletsKit({
      network:
        process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'Public'
          ? ('Public Global Stellar Network ; September 2015' as WalletNetwork)
          : ('Test SDF Network ; September 2015' as WalletNetwork),
      modules: [
        ...allowAllModules(),
        new TrezorModule({
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          appName: 'Stallion',
          email: process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL!,
        }),
        new WalletConnectModule({
          url: process.env.NEXT_PUBLIC_APP_URL!,
          projectId: process.env.NEXT_PUBLIC_APP_URL!,
          method: WalletConnectAllowedMethods.SIGN,
          description:
            'Stallion is a decentralized bounty platform built on the Stellar network',
          name: 'Stallion',
          icons: ['/favicon.svg'],
          network: WalletNetwork.PUBLIC,
        }),
      ],
    });
  }

  return kit;
};

export { initKit };

// Initialize the wallet kit
export const initializeWallet = () => {
  // The kit is already initialized when imported
  return kit;
};

// Get the wallet kit instance
export const getWalletKit = () => {
  return kit;
};
