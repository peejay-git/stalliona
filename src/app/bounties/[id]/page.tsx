'use client';

import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { mockBounties } from '@/utils/mock-data';
import { BountyStatus } from '@/types/bounty';
import { useEffect, useState } from 'react';
import { getBountyById, bountyHasSubmissions } from '@/lib/bounties';
import { assetSymbols } from '@/components/BountyCard';
import BountyDetailSkeleton from '@/components/BountyDetailSkeleton';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function BountyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [bounty, setBounty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [checkingEditStatus, setCheckingEditStatus] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBountyById(params.id);
        setBounty(data);
        console.log('Bounty:', data);
      } catch (err: any) {
        setError(err.message || 'Error fetching bounty');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // if (!bounty) {
  //   notFound();
  // }

  // Format date to be more readable

  // Detect logged-in user and get their ID
  useEffect(() => {
    const auth = getAuth(); // Initialize Firebase auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is logged in, set the user ID (uid)
        setUserId(user.uid);
      } else {
        // User is not logged in
        setUserId(null);
      }
    });

    return () => unsubscribe(); // Clean up on unmount
  }, []);

  // Check if user can edit this bounty (is owner and no submissions)
  useEffect(() => {
    const checkEditPermission = async () => {
      if (!bounty || !userId) {
        setCanEdit(false);
        setCheckingEditStatus(false);
        return;
      }

      if (bounty.owner !== userId) {
        setCanEdit(false);
        setCheckingEditStatus(false);
        return;
      }

      try {
        // Check if bounty has submissions
        const hasSubmissions = await bountyHasSubmissions(params.id);
        setCanEdit(!hasSubmissions);
      } catch (err) {
        console.error("Error checking bounty submissions:", err);
        setCanEdit(false);
      } finally {
        setCheckingEditStatus(false);
      }
    };

    if (bounty && userId) {
      checkEditPermission();
    }
  }, [bounty, userId, params.id]);

  console.log('User ID:', userId); // Log the user ID to the console
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get status color and text
  const getStatusBadge = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.OPEN:
        return (
          <span className="px-3 py-1 bg-green-900/40 text-green-300 border border-green-700/30 rounded-full text-sm font-medium">
            Open
          </span>
        );
      case BountyStatus.IN_PROGRESS:
        return (
          <span className="px-3 py-1 bg-blue-900/40 text-blue-300 border border-blue-700/30 rounded-full text-sm font-medium">
            In Progress
          </span>
        );
      case BountyStatus.REVIEW:
        return (
          <span className="px-3 py-1 bg-yellow-900/40 text-yellow-300 border border-yellow-700/30 rounded-full text-sm font-medium">
            Under Review
          </span>
        );
      case BountyStatus.COMPLETED:
        return (
          <span className="px-3 py-1 bg-gray-700/40 text-gray-300 border border-gray-600/30 rounded-full text-sm font-medium">
            Completed
          </span>
        );
      case BountyStatus.CANCELLED:
        return (
          <span className="px-3 py-1 bg-red-900/40 text-red-300 border border-red-700/30 rounded-full text-sm font-medium">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const handleEditBounty = () => {
    router.push(`/bounties/${params.id}/edit`);
  };

  if (loading) return <BountyDetailSkeleton />;
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="text-sm text-gray-300">
            <Link href="/bounties" className="hover:text-white transition-colors">
              Bounties
            </Link>{' '}
            / {bounty.title}
          </nav>
        </div>

        {/* Bounty header */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{bounty.title}</h1>
              <div className="flex items-center gap-3">
                {getStatusBadge(bounty.status)}
                <span className="text-gray-300 text-sm">
                  Posted on {formatDate(bounty.created)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="bg-white text-black py-3 px-6 rounded-lg text-center">
                <div className="text-sm opacity-90">Reward</div>
                <div className="text-xl font-bold">
                  {assetSymbols[bounty.reward.asset] || ''}{bounty.reward.amount} {bounty.reward.asset}
                </div>
              </div>
              
              {canEdit && (
                <button 
                  onClick={handleEditBounty}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-3 px-4 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Edit Bounty
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-gray-600 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-sm text-gray-300 mb-1">Category</h3>
                <p className="font-medium text-white">{bounty.category}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-300 mb-1">Deadline</h3>
                <p className="font-medium text-white">{formatDate(bounty.deadline)}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-300 mb-1">Posted By</h3>
                <p className="font-medium text-white truncate">
                  {bounty.owner.slice(0, 6)}...{bounty.owner.slice(-4)}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm text-gray-300 mb-1">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {bounty.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="bg-white/10 text-gray-200 px-3 py-1 rounded-full text-sm border border-white/10"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bounty description */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8 mb-8 text-white">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div className="prose max-w-none text-gray-300">
            <p className="whitespace-pre-line">{bounty.description}</p>
          </div>
        </div>

        {/* Apply section */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8 text-white">
          <h2 className="text-xl font-semibold mb-4">Submit Work</h2>
          {bounty.status.toUpperCase() === BountyStatus.OPEN && userId !== bounty.owner ? (
            <div>
              <p className="text-gray-300 mb-6">
                To apply for this bounty, you'll need to connect your Stellar wallet and provide details about your submission.
              </p>
              <div className="mb-6">
                <label htmlFor="submission" className="block text-white font-medium mb-2">
                  Submission Details
                </label>
                <textarea
                  id="submission"
                  rows={6}
                  className="input"
                  placeholder="Explain your approach, provide links to your work, or add any relevant details..."
                ></textarea>
              </div>
              <button className="bg-white text-black font-medium py-2 px-4 rounded-lg hover:bg-white/90 transition-colors">Submit Work</button>
            </div>
          ) : (
            <p className="text-gray-300">
              This bounty is {bounty.status.toLowerCase()} and is not accepting submissions at this time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 