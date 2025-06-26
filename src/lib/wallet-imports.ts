// This file handles dynamic imports of wallet-related modules
let walletKit: any = null;

export const importWalletKit = async () => {
  if (typeof window === 'undefined') {
    return {
      StellarWalletsKit: class {
        constructor() {}
        setWallet() {}
        getAddress() { return Promise.resolve({ address: '' }); }
        getNetwork() { return Promise.resolve({ networkPassphrase: 'Test SDF Network ; September 2015' }); }
        signTransaction() { return Promise.resolve({ signedTxXdr: '', signerAddress: '' }); }
        disconnect() {}
        openModal() { return Promise.resolve(); }
      },
      WalletNetwork: {
        PUBLIC: 'Public Global Stellar Network ; September 2015',
        TESTNET: 'Test SDF Network ; September 2015'
      },
      allowAllModules: () => [],
      TrezorModule: class {
        constructor() {}
      },
      WalletConnectModule: class {
        constructor() {}
      },
      WalletConnectAllowedMethods: {
        SIGN: 'sign'
      }
    };
  }

  if (!walletKit) {
    const [
      { StellarWalletsKit, WalletNetwork, allowAllModules },
      { TrezorModule },
      { WalletConnectModule, WalletConnectAllowedMethods }
    ] = await Promise.all([
      import('@creit.tech/stellar-wallets-kit'),
      import('@creit.tech/stellar-wallets-kit/modules/trezor.module'),
      import('@creit.tech/stellar-wallets-kit/modules/walletconnect.module')
    ]);

    walletKit = {
      StellarWalletsKit,
      WalletNetwork,
      allowAllModules,
      TrezorModule,
      WalletConnectModule,
      WalletConnectAllowedMethods
    };
  }

  return walletKit;
}; 