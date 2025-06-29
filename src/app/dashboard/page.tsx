'use client';

import { assetSymbols } from '@/components/BountyCard';
import Layout from '@/components/Layout';
import TalentWalletConnector from '@/components/TalentWalletConnector';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useWallet } from '@/hooks/useWallet';
import { getAllBounties } from '@/lib/adminService';
import { getBountiesByOwner, getBountyById } from '@/lib/bounties';
import { db } from '@/lib/firebase';
import { useUserStore } from '@/lib/stores/useUserStore';
import { BountyStatus } from '@/types/bounty';
import { mockBounties } from '@/utils/mock-data';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  useProtectedRoute();
  const { isConnected, publicKey, connect } = useWallet();
  const [activeTab, setActiveTab] = useState<'created' | 'submissions'>(
    'created'
  );
  const [bounty, setBounty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const user = useUserStore((state) => state.user);
  const fetchUser = useUserStore((state) => state.fetchUserFromFirestore);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  // Determine if user is a sponsor or talent
  const isSponsor = user?.role === 'sponsor';
  const isTalent = user?.role === 'talent';

  // Fetch user data including wallet info
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        await fetchUser();
        return;
      }

      try {
        // Check if user has a wallet in Firestore but it's not connected in the UI
        if (user.walletConnected && !isConnected) {
          const userDoc = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDoc);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.wallet?.address) {
              // Try to automatically connect the wallet
              setIsLoadingWallet(true);
              await connect({});
              setIsLoadingWallet(false);
            }
          }
        }
      } catch (err) {
        console.error('Error loading wallet data:', err);
        setIsLoadingWallet(false);
      }
    };

    loadUserData();
  }, [user, fetchUser, isConnected, connect]);

  // Fetch bounties
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.uid && !publicKey) return;

        console.log('Fetching bounties for user:', user?.uid);
        console.log('User public key:', publicKey);
        
        // Try to fetch bounties using both user.uid and publicKey
        let data: any[] = [];
        
        if (user?.uid) {
          console.log('Fetching bounties by user.uid:', user.uid);
          const uidBounties = await getBountiesByOwner(user.uid);
          data = [...uidBounties];
        }
        
        if (publicKey && publicKey !== user?.uid) {
          console.log('Fetching bounties by publicKey:', publicKey);
          const keyBounties = await getBountiesByOwner(publicKey);
          // Combine results, avoiding duplicates
          keyBounties.forEach(bounty => {
            if (!data.some(b => b.id === bounty.id)) {
              data.push(bounty);
            }
          });
        }
        
        console.log('All bounties fetched:', JSON.stringify(data, null, 2));
        
        // Ensure each bounty has required fields
        const processedBounties = data.map(bounty => ({
          ...bounty,
          title: bounty.title || 'Untitled Bounty',
          reward: bounty.reward || { amount: '0', asset: 'USDC' },
          status: bounty.status || 'OPEN',
          deadline: bounty.deadline || new Date().toISOString()
        }));
        
        setBounty(processedBounties);
      } catch (err: any) {
        console.error('Error fetching bounties:', err);
        setError(err.message || 'Error fetching bounty');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid, publicKey]);

  // Fetch user submissions
  useEffect(() => {
    const fetchUserSubmissions = async () => {
      try {
        if (!user?.uid && !publicKey) return;
        
        setLoadingSubmissions(true);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
    if (user?.uid) {
          queryParams.append('userId', user.uid);
        }
        if (publicKey) {
          queryParams.append('walletAddress', publicKey);
        }
        
        // Fetch submissions from API
        const response = await fetch(`/api/user/submissions?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
    }
        
        const data = await response.json();
        console.log('User submissions:', data);
        setUserSubmissions(data);
      } catch (err: any) {
        console.error('Error fetching user submissions:', err);
      } finally {
        setLoadingSubmissions(false);
      }
    };
    
    fetchUserSubmissions();
  }, [user?.uid, publicKey]);

  // Filter bounties to simulate user's created bounties (in a real app, this would fetch from contract)
  const userCreatedBounties = mockBounties.filter(
    (_, index) => index % 2 === 0
  );

  // Mock user submissions (in a real app, this would come from the contract)
  // const userSubmissions: {
  //   id: string;
  //   bountyId: string;
  //   bountyTitle: string;
  //   status: string;
  //   submitted: string;
  // }[] = [];

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLogout = async () => {
    try {
      // Show a confirmation dialog
      const confirmLogout = window.confirm('Are you sure you want to log out?');

      // Only proceed with logout if user confirms
      if (confirmLogout) {
        const auth = getAuth();
        await signOut(auth);
        useUserStore.getState().clearUser();

        // Also clear wallet connection info to prevent "Complete Profile" button from showing
        localStorage.removeItem('walletId');

        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isConnected && (!user || !user.walletConnected)) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-white">Dashboard</h1>
            <h1 className="text-2xl font-semibold text-white">
              Welcome {user?.username || user?.firstName || '...'}
            </h1>

            <TalentWalletConnector
              onSuccess={() => {
                // Refresh the page after successful wallet connection
                // window.location.reload();
              }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1> */}
          <div className="mb-8 flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user?.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.firstName?.charAt(0) || '...'
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-[#070708]"></div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Welcome {user?.firstName || '...'}
              </h1>
              <p className="text-gray-400">@{user?.username || '...'}</p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Account Overview
                  </h2>
                  <p className="text-gray-300 truncate">
                    {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                  </p>
                </div>
                <div className="flex gap-3">
                  {/* Only show Create Bounty button for sponsors */}
                  {isSponsor && (
                  <Link
                    href="/create"
                    className="bg-white text-black font-medium py-2 px-4 rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Create Bounty
                  </Link>
                  )}
                  <Link
                    href="/bounties"
                    className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-2 px-4 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Browse Bounties
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600/20 text-red-300 border border-red-500/40 font-medium py-2 px-4 rounded-lg hover:bg-red-600/30 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-600">
              {/* Only show Bounties Created for sponsors */}
              {isSponsor && (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-300 text-sm mb-1">Bounties Created</p>
                <p className="text-2xl font-semibold text-white">
                  {bounty.length}
                </p>
              </div>
              )}

              {/* Only show Submissions Made for talents */}
              {isTalent && (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                    />
                  </svg>
                </div>
                <p className="text-gray-300 text-sm mb-1">Submissions Made</p>
                <p className="text-2xl font-semibold text-white">
                    {loadingSubmissions ? (
                      <span className="inline-block w-6 h-6 rounded-full border-2 border-green-300 border-t-transparent animate-spin"></span>
                    ) : (
                      userSubmissions.length
                    )}
                </p>
              </div>
              )}

              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                {/* Show different text based on user role */}
                <p className="text-gray-300 text-sm mb-1">
                  {isSponsor ? "Total Spent" : "Total Earned"}
                </p>
                <p className="text-2xl font-semibold text-white">$0 USDC</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden">
            <div className="flex border-b border-gray-600">
              {/* Only show Your Bounties tab for sponsors */}
              {isSponsor && (
              <button
                className={`px-6 py-4 font-medium text-sm focus:outline-none transition-all duration-300 ${
                  activeTab === 'created'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('created')}
              >
                Your Bounties
              </button>
              )}
              <button
                className={`px-6 py-4 font-medium text-sm focus:outline-none transition-all duration-300 ${
                  activeTab === 'submissions'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('submissions')}
              >
                Your Submissions
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'created' && isSponsor && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Bounties You've Created
                  </h3>
                  {loading ? (
                    // Skeleton loader (repeat 3 rows for visual feedback)
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex space-x-4">
                          <div className="w-1/5 h-5 bg-white/10 rounded" />
                          <div className="w-1/5 h-5 bg-white/10 rounded" />
                          <div className="w-1/5 h-5 bg-white/10 rounded" />
                          <div className="w-1/5 h-5 bg-white/10 rounded" />
                          <div className="w-1/5 h-5 bg-white/10 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : bounty.length === 0 ? (
                    <p className="text-gray-300">
                      You haven't created any bounties yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-600">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Title
                            </th>
                            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Reward
                            </th>
                            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Deadline
                            </th>
                            <th className="px-4 py-3 bg-black/20"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                          {bounty.map((bounty) => (
                            <tr key={bounty.id}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                                {bounty.title}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    bounty.status.toUpperCase() ===
                                    BountyStatus.OPEN
                                      ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                                      : bounty.status.toUpperCase() ===
                                        BountyStatus.IN_PROGRESS
                                      ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30'
                                      : bounty.status.toUpperCase() ===
                                        BountyStatus.COMPLETED
                                      ? 'bg-gray-700/40 text-gray-300 border border-gray-600/30'
                                      : 'bg-red-900/40 text-red-300 border border-red-700/30'
                                  }`}
                                >
                                  {bounty.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                {assetSymbols[bounty.reward.asset] || ''}
                                {bounty.reward.amount} {bounty.reward.asset}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                {formatDate(bounty.deadline)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                  href={`/bounties/${bounty.id}`}
                                  className="text-white hover:text-gray-300 transition-colors"
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

              {(activeTab === 'submissions' || isTalent) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Your Submissions
                  </h3>

                  {loadingSubmissions ? (
                    // Skeleton loader for submissions
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex space-x-4">
                          <div className="w-1/4 h-5 bg-white/10 rounded" />
                          <div className="w-1/4 h-5 bg-white/10 rounded" />
                          <div className="w-1/4 h-5 bg-white/10 rounded" />
                          <div className="w-1/4 h-5 bg-white/10 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : userSubmissions.length === 0 ? (
                    <p className="text-gray-300">
                      You haven't submitted any work yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-600">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Bounty
                            </th>
                            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Submitted
                            </th>
                            <th className="px-4 py-3 bg-black/20"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                          {userSubmissions.map((submission) => (
                            <tr key={submission.id}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                                {submission.bountyTitle}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    submission.status === 'PENDING'
                                      ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                                      : submission.status === 'ACCEPTED'
                                      ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                                      : 'bg-red-900/40 text-red-300 border border-red-700/30'
                                  }`}
                                >
                                  {submission.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                {formatDate(submission.submitted)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                  href={`/bounties/${submission.bountyId}`}
                                  className="text-white hover:text-gray-300 transition-colors"
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
    </Layout>
  );
}
