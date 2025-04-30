'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import freighterApi from '@stellar/freighter-api';

// Wallet context type definition
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  networkPassphrase: string;
}

// Default context value
const defaultContext: WalletContextType = {
  isConnected: false,
  isConnecting: false,
  publicKey: null,
  connect: async () => {},
  disconnect: () => {},
  networkPassphrase: '',
};

// Create the context
const WalletContext = createContext<WalletContextType>(defaultContext);

// Provider component
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string>('');

  // Check if Freighter is installed and connected on initial load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if Freighter is available
        if (typeof window === 'undefined') return;
        
        // Check if Freighter is connected
        const isAvailable = await freighterApi.isConnected();
        if (!isAvailable) return;

        // Check if the user has granted permission
        const hasPermission = await freighterApi.isAllowed();
        if (!hasPermission) return;

        try {
          // Get the user's public key
          const walletPublicKey = await freighterApi.getPublicKey();
          
          // Get network details
          const network = await freighterApi.getNetwork();
          
          setPublicKey(walletPublicKey);
          setNetworkPassphrase(
            network === 'TESTNET' 
              ? 'Test SDF Network ; September 2015' 
              : 'Public Global Stellar Network ; September 2015'
          );
          setIsConnected(true);
        } catch (error) {
          console.error('Error getting wallet details:', error);
        }
      } catch (e) {
        console.error('Error checking wallet connection:', e);
      }
    };

    checkConnection();
  }, []);

  // Connect wallet
  const connect = async () => {
    if (isConnected) return;
    
    try {
      setIsConnecting(true);
      
      // Check if Freighter is installed
      const isAvailable = await freighterApi.isConnected();
      
      if (!isAvailable) {
        window.open('https://www.freighter.app/', '_blank');
        return;
      }
      
      try {
        // Enable permission to access the wallet
        await freighterApi.setAllowed();
        
        // Get public key
        const walletPublicKey = await freighterApi.getPublicKey();
        
        // Get network information
        const network = await freighterApi.getNetwork();
        
        setPublicKey(walletPublicKey);
        setNetworkPassphrase(
          network === 'TESTNET' 
            ? 'Test SDF Network ; September 2015' 
            : 'Public Global Stellar Network ; September 2015'
        );
        setIsConnected(true);
      } catch (error) {
        console.error('Error accessing wallet:', error);
      }
    } catch (e) {
      console.error('Error connecting wallet:', e);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setIsConnected(false);
    setPublicKey(null);
    setNetworkPassphrase('');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        publicKey,
        connect,
        disconnect,
        networkPassphrase,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext); 