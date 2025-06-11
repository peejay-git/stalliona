import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bounty, BountyStatus } from '@/types/bounty';
import { FiAward, FiUser } from 'react-icons/fi';

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
};

export function BountyCard({ bounty }: BountyCardProps) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showWinners, setShowWinners] = useState(false);
  const [loadingWinners, setLoadingWinners] = useState(false);

  useEffect(() => {
    // Only fetch winners for completed bounties
    if (bounty.status === BountyStatus.COMPLETED) {
      fetchWinners();
    }
  }, [bounty.id, bounty.status]);

  const fetchWinners = async () => {
    try {
      setLoadingWinners(true);
      const response = await fetch(`/api/bounties/${bounty.id}/winners`);
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

  // Function to format the deadline
  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // Calculate days difference
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `${diffDays} days left`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} left`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Function to get status color class
  const getStatusColor = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.OPEN:
        return 'bg-green-900/40 text-green-300 border border-green-700/30';
      case BountyStatus.IN_PROGRESS:
        return 'bg-blue-900/40 text-blue-300 border border-blue-700/30';
      case BountyStatus.COMPLETED:
        return 'bg-gray-700/40 text-gray-300 border border-gray-600/30';
      case BountyStatus.CANCELLED:
        return 'bg-red-900/40 text-red-300 border border-red-700/30';
      default:
        return 'bg-gray-700/40 text-gray-300 border border-gray-600/30';
    }
  };

  const positionToMedal = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${position}th`;
    }
  };

  const toggleWinners = () => {
    setShowWinners(!showWinners);
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bounty.status as BountyStatus)}`}>
          {bounty.status.toUpperCase()}
        </span>
        <span className="font-semibold text-green-300">{assetSymbols[bounty.reward.asset] || ''}{bounty.reward.amount} {bounty.reward.asset}</span>
      </div>

      <h3 className="text-xl font-semibold mb-2 text-white">{bounty.title}</h3>

      <p className="text-gray-300 mb-4 line-clamp-2">{bounty.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {bounty.skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="bg-white/10 text-gray-200 px-2 py-1 rounded text-xs border border-white/10">
            {skill}
          </span>
        ))}
        {bounty.skills.length > 3 && (
          <span className="bg-white/10 text-gray-200 px-2 py-1 rounded text-xs border border-white/10">
            +{bounty.skills.length - 3} more
          </span>
        )}
      </div>

      {/* Winners section for completed bounties */}
      {bounty.status === BountyStatus.COMPLETED && (
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
                    <div key={winner.position} className="flex items-center gap-3 bg-white/5 p-2 rounded">
                      <div>{positionToMedal(winner.position)}</div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-sm">
                            {winner.position === 1 ? '1st Place' :
                             winner.position === 2 ? '2nd Place' :
                             winner.position === 3 ? '3rd Place' :
                             `${winner.position}th Place`}
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
                <div className="text-gray-400 text-sm py-2">No winners information available</div>
              )}
              
              {winners.length > 3 && (
                <Link href={`/bounties/${bounty.id}`} className="text-blue-400 hover:text-blue-300 text-sm block text-center mt-2">
                  View all winners
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
        <span className="text-sm text-gray-300">
          Deadline: <span className="font-medium text-white">{formatDeadline(bounty.deadline)}</span>
        </span>
        <Link href={`/bounties/${bounty.id}`} className="text-white hover:text-gray-300 font-medium transition-colors">
          View Details →
        </Link>
      </div>
    </div>
  );
} 