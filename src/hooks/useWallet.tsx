'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getWalletKit } from '../lib/wallet';

// Wallet context type definition
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  networkPassphrase: string | null;
  connect: ({
    onWalletSelected,
    modalTitle,
    notAvailableText,
  }: {
    onWalletSelected?: (address: string) => void;
    modalTitle?: string;
    notAvailableText?: string;
  }) => Promise<string | null>;
  disconnect: () => void;
}

// Default context value
const defaultContext: WalletContextType = {
  isConnected: false,
  isConnecting: false,
  publicKey: null,
  networkPassphrase: null,
  connect: async () => null,
  disconnect: () => {},
};

// Local storage keys
const WALLET_ID_KEY = 'walletId';

// Create the context
const WalletContext = createContext<WalletContextType>(defaultContext);

let kit = getWalletKit();

// Provider component
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(
    null,
  );
  const [walletId, setWalletId] = useState<string | null>(null);

  // Initialize wallet on mount
  useEffect(() => {
    kit = getWalletKit();
  }, []);

  // Check if wallet is connected on initial load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if browser environment is available
        if (typeof window === 'undefined') return;
        if (!kit) return;

        // Try to reconnect using the creit kit
        try {
          setIsConnecting(true);

          const storedWalletId = localStorage.getItem(WALLET_ID_KEY);
          if (storedWalletId) {
            setWalletId(storedWalletId);
            kit.setWallet(storedWalletId);
          }

          // Get the wallet public key
          const pubKey = (await kit.getAddress()).address;

          setPublicKey(pubKey);
          setIsConnected(true);
          setNetworkPassphrase((await kit.getNetwork()).networkPassphrase);
        } catch (error) {
          console.error('Error reconnecting to wallet:', error);
        }
      } catch (e) {
        console.error('Error checking wallet connection:', e);
      } finally {
        setIsConnecting(false);
      }
    };

    checkConnection();
  }, []);

  // Connect wallet
  const connect = async (): Promise<string | null> => {
    if (isConnected && publicKey) return publicKey;

    const kit = getWalletKit();
    if (!kit) return null;

    setIsConnecting(true);

    try {
      if (walletId) {
        kit.setWallet(walletId);

        const address = await kit.getAddress();

        if (address?.address) {
          const pubKey = address.address;
          setPublicKey(pubKey);
          setIsConnected(true);
          setNetworkPassphrase((await kit.getNetwork()).networkPassphrase);
          return pubKey;
        }
      }

      const { address } = await kit.authModal();

      if (address) {
        setPublicKey(address);
        setIsConnected(true);
        return address;
      }

      toast.error('No public key returned from wallet');
      return null;
    } catch (e) {
      console.error('Error connecting wallet:', e);
      if ((e as any).code !== -3) {
        console.log('WJWII', (e as any).code);
        toast.error('Error connecting wallet');
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    const kit = getWalletKit();
    if (!kit) return;

    try {
      kit.disconnect();
    } catch (e) {
      console.error('Error disconnecting from wallet:', e);
    }

    setIsConnected(false);
    setPublicKey(null);
    setWalletId(null);
    setNetworkPassphrase(null);
    localStorage.removeItem(WALLET_ID_KEY);
    toast.success('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        publicKey,
        networkPassphrase,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);
