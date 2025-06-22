'use client';

import { useWallet } from '@/hooks/useWallet';
import { connectWallet } from '@/lib/authService';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onSuccess?: () => void;
  autoOpen?: boolean;
}

export default function SimpleWalletConnector({ onSuccess, autoOpen = false }: Props) {
  const { connect, networkPassphrase } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const user = useUserStore((state) => state.user);
  const fetchUser = useUserStore((state) => state.fetchUserFromFirestore);
  
  // Auto-open wallet selector if autoOpen is true
  useEffect(() => {
    if (autoOpen) {
      handleConnectWallet();
    }
  }, [autoOpen]);

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      const publicKey = await connect({});

      if (publicKey && user?.uid) {
        // Save the wallet to the user's account
        await connectWallet({
          address: publicKey,
          publicKey: publicKey,
          network: networkPassphrase!,
        });

        // Update user data in store
        await fetchUser();
        toast.success('Wallet connected successfully!');

        // Call the success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else if (!publicKey) {
        toast.error('Could not connect wallet');
      } else if (!user?.uid) {
        toast.error('Please log in first');
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // If autoOpen is true, don't render any UI
  if (autoOpen) {
    return null;
  }

  // Otherwise, render a minimal UI
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 text-center text-white">
      <button
        onClick={handleConnectWallet}
        disabled={isConnecting}
        className="bg-white text-black font-medium py-2 px-4 rounded-lg hover:bg-white/90 transition-colors"
      >
        {isConnecting ? (
          <span className="flex gap-2 items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>
    </div>
  );
} 