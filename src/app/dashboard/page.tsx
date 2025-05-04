'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { mockBounties } from '@/utils/mock-data';
import { BountyStatus } from '@/types/bounty';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { getAllBounties } from '@/lib/bounties';

export default function DashboardPage() {
  useProtectedRoute();
  const { isConnected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'created' | 'submissions'>('created');

  const user = useUserStore((state) => state.user);
  const fetchUser = useUserStore((state) => state.fetchUserFromFirestore);

  const [bounties, setBounties] = useState<any[]>([]);

  useEffect(() => {
    getAllBounties().then(setBounties);
  }, []);

  console.log('Bounties:', bounties);
  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);
  // Filter bounties to simulate user's created bounties (in a real app, this would fetch from contract)
  const userCreatedBounties = mockBounties.filter((_, index) => index % 2 === 0);

  // Mock user submissions (in a real app, this would come from the contract)
  const userSubmissions = [
    {
      id: 's1',
      bountyId: '2',
      bountyTitle: 'Design Landing Page for DeFi Application',
      status: 'PENDING',
      submitted: '2023-04-28T15:30:00Z',
    },
    {
      id: 's2',
      bountyId: '3',
      bountyTitle: 'Implement Soroban Smart Contract for Token Vesting',
      status: 'ACCEPTED',
      submitted: '2023-04-20T10:15:00Z',
    },
    {
      id: 's3',
      bountyId: '5',
      bountyTitle: 'Develop Payment Processing Plugin for WooCommerce',
      status: 'REJECTED',
      submitted: '2023-04-15T09:00:00Z',
    },
  ];

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <h1 className="text-2xl font-semibold">Welcome {user?.username || '...'}</h1>

          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-600 mb-6">
              Connect your Stellar wallet to view your dashboard.
            </p>
            <button className="btn-primary">Connect Wallet</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1> */}
        <h1 className="text-2xl font-semibold">Welcome {user?.firstName || '...'}</h1>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Account Overview</h2>
                <p className="text-gray-500 truncate">
                  {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/create" className="btn-primary">
                  Create Bounty
                </Link>
                <Link href="/bounties" className="btn-secondary">
                  Browse Bounties
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
            <div className="p-6 text-center">
              <p className="text-gray-500 text-sm mb-1">Bounties Created</p>
              <p className="text-2xl font-semibold">{userCreatedBounties.length}</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-500 text-sm mb-1">Submissions Made</p>
              <p className="text-2xl font-semibold">{userSubmissions.length}</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-500 text-sm mb-1">Total Earned</p>
              <p className="text-2xl font-semibold gradient-text">$750 USDC</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-4 font-medium text-sm focus:outline-none ${activeTab === 'created'
                ? 'text-stellar-blue border-b-2 border-stellar-blue'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('created')}
            >
              Your Bounties
            </button>
            <button
              className={`px-6 py-4 font-medium text-sm focus:outline-none ${activeTab === 'submissions'
                ? 'text-stellar-blue border-b-2 border-stellar-blue'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('submissions')}
            >
              Your Submissions
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'created' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Bounties You've Created</h3>

                {userCreatedBounties.length === 0 ? (
                  <p className="text-gray-500">You haven't created any bounties yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reward
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Deadline
                          </th>
                          <th className="px-4 py-3 bg-gray-50"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userCreatedBounties.map((bounty) => (
                          <tr key={bounty.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {bounty.title}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bounty.status === BountyStatus.OPEN
                                  ? 'bg-green-100 text-green-800'
                                  : bounty.status === BountyStatus.IN_PROGRESS
                                    ? 'bg-blue-100 text-blue-800'
                                    : bounty.status === BountyStatus.COMPLETED
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {bounty.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${bounty.reward.amount} {bounty.reward.asset}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(bounty.deadline)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/bounties/${bounty.id}`}
                                className="text-stellar-blue hover:underline"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Submissions</h3>

                {userSubmissions.length === 0 ? (
                  <p className="text-gray-500">You haven't submitted any work yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bounty
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitted
                          </th>
                          <th className="px-4 py-3 bg-gray-50"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userSubmissions.map((submission) => (
                          <tr key={submission.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {submission.bountyTitle}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${submission.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : submission.status === 'ACCEPTED'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {submission.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(submission.submitted)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/bounties/${submission.bountyId}`}
                                className="text-stellar-blue hover:underline"
                              >
                                View Bounty
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 