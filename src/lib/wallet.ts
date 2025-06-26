// Types from @creit.tech/stellar-wallets-kit
export type WalletNetwork = {
  PUBLIC: string;
  TESTNET: string;
};

export type StellarWalletsKit = {
  setWallet: (id: string) => void;
  getAddress: () => Promise<{ address: string }>;
  getNetwork: () => Promise<{ networkPassphrase: string }>;
  signTransaction: (transaction: string) => Promise<{ signedTxXdr: string; signerAddress?: string }>;
  disconnect: () => void;
  openModal: (options: any) => Promise<void>;
};

let kit: StellarWalletsKit | null = null;

export const initializeWallet = async () => {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

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

  // Only initialize once
  if (!kit) {
    try {
      const {
        StellarWalletsKit,
        WalletNetwork,
        allowAllModules,
        TrezorModule,
        WalletConnectModule,
        WalletConnectAllowedMethods
      } = await import('./wallet-imports').then(m => m.importWalletKit());

      kit = new StellarWalletsKit({
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
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
      return null;
    }
  }

  return kit;
};

export const getWalletKit = () => kit;
