'use client';

import Layout from '@/components/Layout';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useWallet } from '@/hooks/useWallet';
import { connectWallet } from '@/lib/authService';
import { useUserStore } from '@/lib/stores/useUserStore';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function ConnectWalletPage() {
  useProtectedRoute();
  const router = useRouter();
  const { connect, isConnected, publicKey, networkPassphrase } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useUserStore((state) => state.user);

  // Redirect if user already has a wallet connected
  useEffect(() => {
    if (user?.walletConnected) {
      router.push('/dashboard');
    }
  }, [user?.walletConnected, router]);

  const handleConnectWallet = async () => {
    try {
      setIsSubmitting(true);

      if (!isConnected) {
        await connect({});
      }

      if (!publicKey) {
        toast.error('Failed to get wallet public key');
        return;
      }

      // Store wallet info in user account
      await connectWallet({
        address: publicKey,
        publicKey: publicKey,
        network: networkPassphrase!,
      });

      toast.success('Wallet connected successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <motion.div
          className="max-w-md mx-auto w-full"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-xl"
            variants={itemVariants}
          >
            <div className="p-8">
              <motion.h2
                className="text-3xl font-bold mb-2 text-white text-center"
                variants={itemVariants}
              >
                Connect Your Wallet
              </motion.h2>

              <motion.p
                className="text-gray-300 text-center mb-8"
                variants={itemVariants}
              >
                Connect your Stellar wallet to complete your profile setup
              </motion.p>

              {isConnected ? (
                <motion.div
                  className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 mb-6"
                  variants={itemVariants}
                >
                  <p className="text-white font-medium">Wallet Connected</p>
                  <p className="text-sm text-gray-300 break-all mt-1">
                    {publicKey}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6"
                  variants={itemVariants}
                >
                  <p className="text-white font-medium">No Wallet Connected</p>
                  <p className="text-sm text-gray-300 mt-1">
                    You'll need to install and connect a Stellar wallet like
                    Freighter
                  </p>
                </motion.div>
              )}

              <motion.div className="space-y-4" variants={itemVariants}>
                <motion.button
                  onClick={handleConnectWallet}
                  disabled={isSubmitting || (isConnected && isSubmitting)}
                  className="bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-white/90 transition-colors w-full flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <span className="flex gap-2 items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
                    </span>
                  ) : isConnected ? (
                    'Save Wallet Connection'
                  ) : (
                    'Connect Wallet'
                  )}
                </motion.button>

                <motion.button
                  onClick={handleSkip}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-3 px-4 rounded-lg hover:bg-white/20 transition-colors w-full"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Skip for Now
                </motion.button>
              </motion.div>

              <motion.p
                className="text-gray-300 text-sm mt-6 text-center"
                variants={itemVariants}
              >
                Don't have a Stellar wallet?{' '}
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline"
                >
                  Get Freighter
                </a>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
