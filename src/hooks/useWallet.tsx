'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import * as freighterApi from '@stellar/freighter-api';
import toast from 'react-hot-toast';

// Wallet context type definition
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  walletType: string | null;
  publicKey: string | null;
  connect: (walletType?: string) => Promise<string | null>;
  disconnect: () => void;
  networkPassphrase: string;
}

// Default context value
const defaultContext: WalletContextType = {
  isConnected: false,
  isConnecting: false,
  walletType: null,
  publicKey: null,
  connect: async () => null,
  disconnect: () => {},
  networkPassphrase: '',
};

// Create the context
const WalletContext = createContext<WalletContextType>(defaultContext);

// Local storage key
const STORAGE_KEY = 'stallionWalletType';

// Provider component
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string>('');

  // Check if wallet is connected on initial load
  useEffect(() => {
    let isMounted = true;
    
    const checkConnection = async () => {
      try {
        // Check if browser environment is available
        if (typeof window === 'undefined') return;
        
        // Check local storage for saved wallet type
        const savedWalletType = localStorage.getItem(STORAGE_KEY);
        if (!savedWalletType) return;

        // Try to reconnect based on wallet type
        if (savedWalletType === 'freighter') {
          try {
            // Ensure Freighter is available
            if (typeof freighterApi.isConnected !== 'function') {
              localStorage.removeItem(STORAGE_KEY);
              return;
            }
            
            const isAvailable = await freighterApi.isConnected();
            if (!isAvailable) {
              localStorage.removeItem(STORAGE_KEY);
              return;
            }

            const hasPermission = await freighterApi.isAllowed();
            if (!hasPermission) {
              localStorage.removeItem(STORAGE_KEY);
              return;
            }

            const walletPublicKey = await freighterApi.getPublicKey();
            const network = await freighterApi.getNetwork();
            
            // Check if component is still mounted before updating state
            if (!isMounted) return;
            
            setPublicKey(walletPublicKey);
            setWalletType('freighter');
            setNetworkPassphrase(
              network === 'TESTNET' 
                ? 'Test SDF Network ; September 2015' 
                : 'Public Global Stellar Network ; September 2015'
            );
            setIsConnected(true);
          } catch (error) {
            console.error('Error reconnecting to Freighter:', error);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        // For other wallet types, don't auto-reconnect as they usually don't support it
        // or require user interaction
        else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error('Error checking wallet connection:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    // Add a delay to make sure the page has loaded properly
    const timer = setTimeout(checkConnection, 1000);
    
    // Clean up on unmount
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Connect wallet
  const connect = async (walletType = 'freighter'): Promise<string | null> => {
    if (isConnected && publicKey) return publicKey;
    
    setIsConnecting(true);
    
    try {
      // Handle Freighter connection
      if (walletType === 'freighter') {
        try {
          // Check if Freighter is installed
          if (typeof freighterApi.isConnected !== 'function') {
            toast.error('Freighter extension not detected');
            setIsConnecting(false);
            return null;
          }
          
          // Check if Freighter is connected to the browser
          const isAvailable = await freighterApi.isConnected();
          if (!isAvailable) {
            toast.error('Freighter not connected to browser');
            setIsConnecting(false);
            return null;
          }
          
          // Request permission
          await freighterApi.setAllowed();
          
          // Get public key
          const walletPublicKey = await freighterApi.getPublicKey();
          if (!walletPublicKey) {
            toast.error('Failed to get Freighter public key');
            setIsConnecting(false);
            return null;
          }
          
          // Get network information
          const network = await freighterApi.getNetwork();
          
          setPublicKey(walletPublicKey);
          setWalletType('freighter');
          setNetworkPassphrase(
            network === 'TESTNET' 
              ? 'Test SDF Network ; September 2015' 
              : 'Public Global Stellar Network ; September 2015'
          );
          setIsConnected(true);
          
          // Save wallet type to local storage
          localStorage.setItem(STORAGE_KEY, 'freighter');
          
          return walletPublicKey;
        } catch (error) {
          console.error('Error connecting to Freighter:', error);
          toast.error('Error connecting to Freighter wallet');
          setIsConnecting(false);
          return null;
        }
      } 
      // Handle Albedo connection
      else if (walletType === 'albedo') {
        try {
          // Check if albedo object is available (it's only available when imported via script)
          if (typeof window.albedo === 'undefined') {
            toast.error('Albedo not available - please wait for the page to fully load');
            setIsConnecting(false);
            return null;
          }
          
          // Request public key from Albedo
          const result = await window.albedo.publicKey({
            require_existing: false // Don't require a previously connected account
          });
          
          if (result && result.pubkey) {
            setPublicKey(result.pubkey);
            setWalletType('albedo');
            setNetworkPassphrase('Public Global Stellar Network ; September 2015');
            setIsConnected(true);
            
            // Save wallet type to local storage
            localStorage.setItem(STORAGE_KEY, 'albedo');
            
            return result.pubkey;
          }
          
          toast.error('No public key returned from Albedo');
          setIsConnecting(false);
          return null;
        } catch (error) {
          console.error('Error connecting to Albedo:', error);
          toast.error('Error connecting to Albedo');
          setIsConnecting(false);
          return null;
        }
      } 
      // Handle xBull connection
      else if (walletType === 'xbull') {
        try {
          // Check if xBull is available
          if (typeof window.xBullSDK === 'undefined') {
            toast.error('xBull extension not detected');
            setIsConnecting(false);
            return null;
          }
          
          // Request connection to xBull
          const result = await window.xBullSDK.connect();
          
          if (result && result.publicKey) {
            setPublicKey(result.publicKey);
            setWalletType('xbull');
            setNetworkPassphrase('Public Global Stellar Network ; September 2015');
            setIsConnected(true);
            
            // Save wallet type to local storage
            localStorage.setItem(STORAGE_KEY, 'xbull');
            
            return result.publicKey;
          }
          
          toast.error('No public key returned from xBull');
          setIsConnecting(false);
          return null;
        } catch (error) {
          console.error('Error connecting to xBull:', error);
          toast.error('Error connecting to xBull');
          setIsConnecting(false);
          return null;
        }
      } 
      // Handle LOBSTR connection
      else if (walletType === 'lobstr') {
        try {
          // Check if LOBSTR wallet link is available
          if (typeof window.StellarWalletLinkJSSDK === 'undefined') {
            toast.error('LOBSTR extension not detected');
            setIsConnecting(false);
            return null;
          }
          
          // Initialize LOBSTR wallet link
          const walletLink = new window.StellarWalletLinkJSSDK.WalletConnect({
            appName: 'Stallion',
            appIcon: window.location.origin + '/images/unicorn-logo.svg'
          });
          
          // Request connection
          const result = await walletLink.connect();
          
          if (result && result.publicKey) {
            setPublicKey(result.publicKey);
            setWalletType('lobstr');
            setNetworkPassphrase('Public Global Stellar Network ; September 2015');
            setIsConnected(true);
            
            // Save wallet type to local storage
            localStorage.setItem(STORAGE_KEY, 'lobstr');
            
            return result.publicKey;
          }
          
          toast.error('No public key returned from LOBSTR');
          setIsConnecting(false);
          return null;
        } catch (error) {
          console.error('Error connecting to LOBSTR:', error);
          toast.error('Error connecting to LOBSTR');
          setIsConnecting(false);
          return null;
        }
      }
      
      toast.error('Unsupported wallet type');
      setIsConnecting(false);
      return null;
    } catch (e) {
      console.error('Error connecting wallet:', e);
      toast.error('Error connecting wallet');
      setIsConnecting(false);
      return null;
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    console.log('Wallet disconnect called from:', new Error().stack);
    setIsConnected(false);
    setWalletType(null);
    setPublicKey(null);
    setNetworkPassphrase('');
    
    // Remove wallet type from local storage
    localStorage.removeItem(STORAGE_KEY);
    
    toast.success('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        walletType,
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

// TypeScript declarations for wallet integration
declare global {
  interface Window {
    albedo?: {
      publicKey: (options: { require_existing: boolean }) => Promise<{ pubkey: string }>;
    };
    xBullSDK?: {
      connect: () => Promise<{ publicKey: string }>;
    };
    StellarWalletLinkJSSDK?: {
      WalletConnect: new (options: { appName: string; appIcon: string }) => {
        connect: () => Promise<{ publicKey: string }>;
      };
    };
  }
} 