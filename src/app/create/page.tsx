'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateBountyForm from '@/components/CreateBountyForm';
import Layout from '@/components/Layout';
import { useWallet } from '@/hooks/useWallet';
import { useUserStore } from '@/lib/stores/useUserStore';
import { IoWalletOutline, IoInformationCircleOutline } from 'react-icons/io5';

export default function CreateBountyPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const user = useUserStore((state) => state.user);
  
  if (!isConnected) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <IoWalletOutline className="text-blue-300 text-2xl flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-blue-200">
                  You'll need to connect your Stellar wallet to create a bounty. The bounty reward will be locked in a smart contract until the work is completed and accepted.
                </p>
                <button 
                  onClick={() => window.location.href = '/connect-wallet'}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!user || user.role !== 'sponsor') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <IoInformationCircleOutline className="text-red-300 text-2xl flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Sponsor Account Required</h3>
                <p className="text-red-200">
                  Only sponsors can create bounties. Please register as a sponsor to continue.
                </p>
                <button 
                  onClick={() => window.location.href = '/register?role=sponsor'}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Register as Sponsor
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Create a New Bounty</h1>
        
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <IoInformationCircleOutline className="text-blue-300 text-2xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">How Bounty Creation Works</h3>
              <p className="text-blue-200">
                When you create a bounty, you'll need to pay the reward amount and transaction fees.
                The reward will be locked in a smart contract until the work is completed and accepted.
              </p>
            </div>
          </div>
        </div>
        
        <CreateBountyForm />
      </div>
    </Layout>
  );
} 