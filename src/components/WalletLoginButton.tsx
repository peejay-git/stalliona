'use client';

import { useWallet } from '@/hooks/useWallet';
import { findUserByWalletAddress } from '@/lib/authService';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Props {
  onSuccess?: () => void;
  className?: string;
}

export default function WalletLoginButton({ onSuccess, className }: Props) {
  const { connect } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleWalletLogin = async () => {
    try {
      setIsLoading(true);
      const publicKey = await connect({});

      if (!publicKey) {
        toast.error('Could not connect wallet');
        return;
      }

      // Try to find and authenticate user by wallet address
      const result = await findUserByWalletAddress(publicKey);

      if (result.success) {
        toast.success('Login successful!');
        
        // Call success callback or redirect to dashboard
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard');
        }
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Error logging in with wallet:', err);
      toast.error('Failed to login with wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleWalletLogin}
      disabled={isLoading}
      className={`bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-2 px-4 rounded-lg hover:bg-white/20 transition-colors ${className || ''}`}
    >
      {isLoading ? (
        <span className="flex gap-2 items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 rounded-full bg-white animate-bounce"></span>
        </span>
      ) : (
        'Login with Wallet'
      )}
    </button>
  );
} 