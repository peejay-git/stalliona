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
    'Missing required environment variable NEXT_PUBLIC_STELLAR_NETWORK'
  );
}

if (!process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL) {
  throw new Error(
    'Missing required environment variable NEXT_PUBLIC_TREZOR_CONTACT_EMAIL'
  );
}

export const kit = new StellarWalletsKit({
  network:
    process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'Public'
      ? WalletNetwork.PUBLIC
      : WalletNetwork.TESTNET,
  modules: [
    ...allowAllModules(),
    new TrezorModule({
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      email: process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL,
    }),
    new WalletConnectModule({
      url: process.env.NEXT_PUBLIC_APP_URL,
      projectId: process.env.NEXT_PUBLIC_APP_URL,
      method: WalletConnectAllowedMethods.SIGN,
      description:
        'Stallion is a decentralized bounty platform built on the Stellar network',
      name: 'Stallion',
      icons: ['/favicon.svg'],
      network: WalletNetwork.PUBLIC,
    }),
  ],
});

// Initialize the wallet kit
export const initializeWallet = () => {
  // The kit is already initialized when imported
  return kit;
};

// Get the wallet kit instance
export const getWalletKit = () => {
  return kit;
};
