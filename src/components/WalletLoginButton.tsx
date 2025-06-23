'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { findUserByWalletAddress } from '@/lib/authService';
import toast from 'react-hot-toast';
import { SiBlockchaindotcom } from 'react-icons/si';

interface WalletLoginButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function WalletLoginButton({ 
  onSuccess, 
  className = "bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-white/90 transition-colors w-full flex items-center justify-center gap-2"
}: WalletLoginButtonProps) {
  const router = useRouter();
  const { connect, isConnected, publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletLogin = async () => {
    try {
      setIsLoading(true);

      // If wallet is already connected, try to log in with it
      if (isConnected && publicKey) {
        const result = await findUserByWalletAddress(publicKey);
        
        if (result.success) {
          toast.success('Login successful!');
          onSuccess?.();
          router.push('/dashboard');
          return;
        } else {
          toast.error(result.message || 'No account found with this wallet');
          return;
        }
      }

      // If not connected, connect wallet first
      const walletAddress = await connect({});
      
      if (!walletAddress) {
        toast.error('Failed to connect wallet');
        return;
      }

      // Try to find user by wallet address
      const result = await findUserByWalletAddress(walletAddress);
      
      if (result.success) {
        toast.success('Login successful!');
        onSuccess?.();
        router.push('/dashboard');
      } else {
        toast.error(result.message || 'No account found with this wallet');
      }
    } catch (error) {
      console.error('Error logging in with wallet:', error);
      toast.error('Failed to log in with wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleWalletLogin}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <span className="flex gap-2 items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 rounded-full bg-current animate-bounce"></span>
        </span>
      ) : (
        <>
          <SiBlockchaindotcom className="h-5 w-5" />
          Login with Wallet
        </>
      )}
    </button>
  );
} 