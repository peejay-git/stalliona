'use client';

import { useWallet } from '@/hooks/useWallet';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { BiArrowBack } from 'react-icons/bi';
import { FiExternalLink } from 'react-icons/fi';

// Add TypeScript declarations for wallet APIs
declare global {
  interface Window {
    freighterApi?: {
      isConnected: () => Promise<boolean>;
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

type Props = {
  onConnect: (walletType: string, publicKey: string) => void;
  onBack: () => void;
  loading?: boolean;
};

const wallets = [
  {
    id: 'freighter',
    name: 'Freighter',
    icon: '/images/wallets/freighter.svg',
    desc: 'The most popular Stellar wallet',
    installUrl: 'https://www.freighter.app/',
  },
  {
    id: 'albedo',
    name: 'Albedo',
    icon: '/images/wallets/albedo.svg',
    desc: 'Web-based Stellar wallet',
    installUrl: 'https://albedo.link/',
  },
  {
    id: 'xbull',
    name: 'xBull',
    icon: '/images/wallets/xbull.svg',
    desc: 'Multi-platform Stellar wallet',
    installUrl: 'https://xbull.app/',
  },
  {
    id: 'lobstr',
    name: 'LOBSTR',
    icon: '/images/wallets/lobstr.svg',
    desc: 'Simple and secure Stellar wallet',
    installUrl: 'https://lobstr.co/',
  },
];

export default function WalletSelector({
  onConnect,
  onBack,
  loading = false,
}: Props) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletAvailability, setWalletAvailability] = useState<
    Record<string, boolean>
  >({
    freighter: true,
    albedo: true, // Always available as web-based
    xbull: false,
    lobstr: false,
  });
  const { connect, isConnecting } = useWallet();
  const [checkComplete, setCheckComplete] = useState(false);

  // Check which wallets are available
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Function to check Freighter availability
    const checkFreighter = async () => {
      try {
        // return (
        //   typeof window.freighterApi !== 'undefined' &&
        //   (await window.freighterApi?.isConnected()) === true
        // );
        return true;
      } catch (e) {
        return false;
      }
    };

    // Function to check xBull availability
    const checkXBull = () => {
      return typeof window.xBullSDK !== 'undefined';
    };

    // Function to check LOBSTR availability
    const checkLobstr = () => {
      return typeof window.StellarWalletLinkJSSDK !== 'undefined';
    };

    // Main check function with a timeout
    const checkWallets = async () => {
      try {
        const freighterAvailable = await checkFreighter();
        const xbullAvailable = checkXBull();
        const lobstrAvailable = checkLobstr();

        setWalletAvailability({
          freighter: freighterAvailable,
          albedo: true, // Always available as web-based
          xbull: xbullAvailable,
          lobstr: lobstrAvailable,
        });
      } catch (error) {
        console.error('Error checking wallet availability:', error);
      } finally {
        setCheckComplete(true);
      }
    };

    // Start wallet check with a delay to ensure extensions are loaded
    const timer = setTimeout(checkWallets, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleWalletConnect = async (walletId: string) => {
    try {
      // If wallet is not available and isn't Albedo, offer to install it
      if (!isWalletAvailable(walletId) && walletId !== 'albedo') {
        const wallet = wallets.find((w) => w.id === walletId);
        if (wallet) {
          window.open(wallet.installUrl, '_blank');
          return;
        }
      }

      setSelectedWallet(walletId);
      const publicKey = await connect(walletId);
      if (publicKey) {
        onConnect(walletId, publicKey);
      } else {
        setSelectedWallet(null);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setSelectedWallet(null);
    }
  };

  const isWalletAvailable = (walletId: string) => {
    // Albedo is always available as it's web-based
    if (walletId === 'albedo') return true;
    return walletAvailability[walletId] === true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="text-gray-300 hover:text-white transition-colors"
        >
          <BiArrowBack className="w-5 h-5" />
        </button>
        <h3 className="text-white text-lg font-medium mx-auto pr-5">
          Connect Wallet
        </h3>
      </div>

      {!checkComplete ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center space-x-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse [animation-delay:0.4s]"></div>
          </div>
          <p className="text-white text-sm font-medium">
            Checking wallet extensions...
          </p>
          <p className="text-gray-400 text-xs mt-1">This may take a moment</p>
        </div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-300">No wallets found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {wallets.map((wallet) => (
            <motion.button
              key={wallet.id}
              onClick={() => handleWalletConnect(wallet.id)}
              disabled={isConnecting || loading}
              className={`w-full flex items-center p-4 rounded-lg border transition-all ${
                selectedWallet === wallet.id
                  ? 'bg-white/10 border-white/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="h-10 w-10 relative flex-shrink-0 bg-white/10 rounded-md overflow-hidden">
                <Image
                  src={wallet.icon}
                  alt={wallet.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>

              <div className="ml-3 text-left flex-1">
                <p className="text-white font-medium flex items-center">
                  {wallet.name}
                  {!isWalletAvailable(wallet.id) && wallet.id !== 'albedo' && (
                    <span className="ml-2 text-amber-400 text-xs border border-amber-400/30 rounded px-1.5 py-0.5">
                      Not Installed
                    </span>
                  )}
                </p>
                <p className="text-gray-400 text-sm">
                  {!isWalletAvailable(wallet.id) && wallet.id !== 'albedo' ? (
                    <span className="flex items-center gap-1">
                      Click to install <FiExternalLink size={12} />
                    </span>
                  ) : (
                    wallet.desc
                  )}
                </p>
              </div>

              {selectedWallet === wallet.id && isConnecting && (
                <div className="flex space-x-1 ml-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-white animate-bounce"></span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
