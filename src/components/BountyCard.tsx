import { Bounty, BountyStatus } from '@/types/bounty';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiAward, FiUser, FiUsers } from 'react-icons/fi';

interface BountyCardProps {
  bounty: Bounty;
}

type Winner = {
  applicantAddress: string;
  position: number;
  percentage: number;
  content: string;
  rewardAmount: string;
  rewardAsset: string;
};

export const assetSymbols: Record<string, string> = {
  USDC: '$',
  XLM: '★',
  EURC: '€',
  NGNC: 'N',
  KALE: 'K',
  // Add a default symbol for unknown assets
  DEFAULT: '●',
};

export function BountyCard({ bounty }: BountyCardProps) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showWinners, setShowWinners] = useState(false);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [countdown, setCountdown] = useState<string>('');
  const [isCountdownExpired, setIsCountdownExpired] = useState(false);

  // Ensure bounty has all required fields with defaults
  const safeBounty = {
    ...bounty,
    title: bounty.title || 'Untitled Bounty',
    description: bounty.description || 'No description provided',
    status: bounty.status || BountyStatus.OPEN,
    reward: bounty.reward || { amount: '0', asset: 'USDC' },
    skills: Array.isArray(bounty.skills) ? bounty.skills : [],
    deadline: bounty.deadline || new Date().toISOString(),
    sponsorName: bounty.sponsorName || 'Anonymous',
    submissionDeadline: bounty.submissionDeadline || 0,
  };

  // Ensure reward asset is a string
  const rewardAsset =
    typeof safeBounty.reward.asset === 'string'
      ? safeBounty.reward.asset
      : 'USDC';

  // Get the asset symbol, with fallback
  const assetSymbol = assetSymbols[rewardAsset] || assetSymbols.DEFAULT;

  useEffect(() => {
    // Only fetch winners for completed bounties
    if (safeBounty.status === BountyStatus.COMPLETED) {
      fetchWinners();
    }
    fetchSubmissionCount();
  }, [safeBounty.id, safeBounty.status]);

  // Update countdown timer
  useEffect(() => {
    // Initial countdown calculation
    setCountdown(formatCountdown(safeBounty.submissionDeadline));

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown(formatCountdown(safeBounty.submissionDeadline));
    }, 1000);

    return () => clearInterval(timer);
  }, [safeBounty.id, safeBounty.status, safeBounty.submissionDeadline]);

  const fetchSubmissionCount = async () => {
    try {
      const response = await fetch(`/api/bounties/${bounty.id}/submissions`);
      if (response.ok) {
        const submissions = await response.json();
        setSubmissionCount(submissions.length);
      }
    } catch (error) {
      console.error('Error fetching submission count:', error);
    }
  };

  const fetchWinners = async () => {
    try {
      setLoadingWinners(true);
      const response = await fetch(`/api/bounties/${safeBounty.id}/winners`);
      if (response.ok) {
        const data = await response.json();
        setWinners(data);
      }
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setLoadingWinners(false);
    }
  };

  // Function to format the countdown
  const formatCountdown = (timestamp: number) => {
    // Create Date objects
    // If timestamp is 0 or undefined, maybe use deadline string?
    let deadlineTime = timestamp;
    if (!deadlineTime && safeBounty.deadline) {
      deadlineTime = new Date(safeBounty.deadline).getTime();
    }

    const deadline = new Date(deadlineTime);
    const now = new Date();
    const distance = deadline.getTime() - now.getTime();

    if (distance < 0) {
      setIsCountdownExpired(true);
      return 'Expired';
    }

    setIsCountdownExpired(false);

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Format the countdown string
    let countdownStr = '';
    if (days > 0) {
      countdownStr = `${days}d ${hours}h`;
    } else if (hours > 0) {
      countdownStr = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      countdownStr = `${minutes}m ${seconds}s`;
    } else {
      countdownStr = `${seconds}s`;
    }

    return countdownStr;
  };;

  // Check if bounty is expired
  const isExpired = () => {
    return isCountdownExpired || safeBounty.status === BountyStatus.COMPLETED;
  };

  // Get status badge
  const getStatusColor = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.OPEN:
        return 'bg-green-900/40 text-green-300 border border-green-700/30';
      case BountyStatus.IN_PROGRESS:
        return 'bg-blue-900/40 text-blue-300 border border-blue-700/30';
      case BountyStatus.COMPLETED:
        return 'bg-gray-700/40 text-gray-300 border border-gray-600/30';
      default:
        return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30';
    }
  };

  const positionToMedal = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${position}th`;
    }
  };

  const toggleWinners = () => {
    setShowWinners(!showWinners);
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(safeBounty.status as BountyStatus)}`}
          >
            {safeBounty.status.toUpperCase()}
          </span>
          <span className="font-medium text-green-300 bg-green-900/30 px-3 py-1 rounded-full border border-green-700/30">
            {assetSymbol}
            {safeBounty.reward.amount} {safeBounty.reward.asset}
          </span>
        </div>

        <h3 className="text-xl font-semibold mb-3 text-white">
          {safeBounty.title}
        </h3>

        <p className="text-gray-300 mb-4 line-clamp-2">
          {safeBounty.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {safeBounty.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="bg-white/10 text-gray-200 px-3 py-1 rounded-full text-xs border border-white/10"
            >
              {skill}
            </span>
          ))}
          {safeBounty.skills.length > 3 && (
            <span className="bg-white/10 text-gray-200 px-3 py-1 rounded-full text-xs border border-white/10">
              +{safeBounty.skills.length - 3} more
            </span>
          )}
        </div>

        {/* Submission count */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
          <FiUsers className="text-gray-400" />
          <span>
            {submissionCount}{' '}
            {submissionCount === 1 ? 'submission' : 'submissions'}
          </span>
        </div>

        {/* Winners section for completed bounties */}
        {safeBounty.status === BountyStatus.COMPLETED && (
          <div className="mb-4">
            <button
              onClick={toggleWinners}
              className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors font-medium mb-2"
            >
              <FiAward className="text-yellow-400" />
              <span>{showWinners ? 'Hide Winners' : 'Show Winners'}</span>
            </button>

            {showWinners && (
              <div className="mt-2 space-y-2">
                {loadingWinners ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : winners.length > 0 ? (
                  winners
                    .sort((a, b) => a.position - b.position)
                    .slice(0, 3) // Show only top 3 winners
                    .map((winner) => (
                      <div
                        key={winner.position}
                        className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10"
                      >
                        <div>{positionToMedal(winner.position)}</div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-center">
                            <span className="text-white text-sm">
                              {winner.position === 1
                                ? '1st Place'
                                : winner.position === 2
                                  ? '2nd Place'
                                  : winner.position === 3
                                    ? '3rd Place'
                                    : `${winner.position}th Place`}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {winner.percentage}%
                            </span>
                          </div>
                          <div className="text-gray-400 text-xs flex items-center gap-1">
                            <FiUser className="flex-shrink-0" />
                            <span className="truncate">
                              {winner.applicantAddress === 'No winner selected'
                                ? 'No winner selected'
                                : `${winner.applicantAddress.substring(0, 6)}...${winner.applicantAddress.substring(winner.applicantAddress.length - 4)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-gray-400 text-sm py-2">
                    No winners information available
                  </div>
                )}

                {winners.length > 3 && (
                  <Link
                    href={`/bounties/${safeBounty.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm block text-center mt-2"
                  >
                    View all winners
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Deadline</span>
            <span className="font-medium text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10">
              {countdown}
            </span>
          </div>
          <Link
            href={`/bounties/${safeBounty.id}`}
            className="bg-white/10 text-white hover:bg-white/20 font-medium py-2 px-4 rounded-lg transition-colors border border-white/10"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
