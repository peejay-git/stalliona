import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bounty, BountyStatus } from '@/types/bounty';
import { FiAward, FiUser, FiClock, FiBriefcase } from 'react-icons/fi';

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

type CountdownTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
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
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

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
  };

  // Ensure reward asset is a string
  const rewardAsset = typeof safeBounty.reward.asset === 'string' 
    ? safeBounty.reward.asset 
    : 'USDC';

  // Get the asset symbol, with fallback
  const assetSymbol = assetSymbols[rewardAsset] || assetSymbols.DEFAULT;

  useEffect(() => {
    // Only fetch winners for completed bounties
    if (safeBounty.status === BountyStatus.COMPLETED) {
      fetchWinners();
    }
  }, [safeBounty.id, safeBounty.status]);

  // Update countdown timer
  useEffect(() => {
    const calculateCountdown = () => {
      const deadline = new Date(safeBounty.deadline).getTime();
      const now = new Date().getTime();
      const timeLeft = deadline - now;

<<<<<<< Updated upstream
      if (timeLeft <= 0) {
        // Deadline has passed
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true
        });
        return;
=======
    // Log the initial deadline for debugging
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('Initial deadline check for bounty:', bounty.id, {
      submissionDeadline: bounty.submissionDeadline,
      deadline: bounty.deadline,
      submissionDate: new Date(bounty.submissionDeadline).toLocaleString(),
      deadlineDate: new Date(bounty.deadline).toLocaleString(),
      timezone,
      currentTime: new Date().toLocaleString(),
      currentUTC: new Date().toUTCString()
    });

    // Initial countdown calculation
    setCountdown(formatCountdown(bounty.submissionDeadline));

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown(formatCountdown(bounty.submissionDeadline));
    }, 1000);

    return () => clearInterval(timer);
  }, [bounty.id, bounty.status, bounty.submissionDeadline, bounty.deadline]);

  const fetchSubmissionCount = async () => {
    try {
      const response = await fetch(`/api/bounties/${bounty.id}/submissions`);
      if (response.ok) {
        const submissions = await response.json();
        setSubmissionCount(submissions.length);
>>>>>>> Stashed changes
      }

      // Calculate time units
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        expired: false
      });
    };

    // Calculate initial countdown
    calculateCountdown();

    // Update countdown every second
    const timer = setInterval(calculateCountdown, 1000);

    // Clean up timer on unmount
    return () => clearInterval(timer);
  }, [safeBounty.deadline]);

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

<<<<<<< Updated upstream
  // Function to format the deadline
  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
=======
  // Function to format the countdown
  const formatCountdown = (timestamp: number) => {
    // Get current timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Create Date objects in local timezone
    const deadline = new Date(timestamp);
    const now = new Date();

    // Log for debugging
    console.log('Countdown calculation for bounty:', bounty.id, {
      timestamp,
      timezone,
      deadlineLocal: deadline.toLocaleString(),
      deadlineUTC: deadline.toUTCString(),
      nowLocal: now.toLocaleString(),
      nowUTC: now.toUTCString(),
      deadlineTime: deadline.getTime(),
      nowTime: now.getTime(),
      // Add more debug info
      bountyDeadline: bounty.deadline,
      submissionDeadline: bounty.submissionDeadline,
      created: bounty.created
    });

    // Calculate the time difference in milliseconds
    const distance = deadline.getTime() - now.getTime();

    // Log the distance calculation
    console.log('Time distance:', {
      distance,
      inHours: distance / (1000 * 60 * 60),
      inDays: distance / (1000 * 60 * 60 * 24)
    });

    // For existing bounties that might have incorrect timestamps
    if (distance < 0) {
      // Try parsing the deadline string directly
      const deadlineFromString = new Date(bounty.deadline);
      const distanceFromString = deadlineFromString.getTime() - now.getTime();

      console.log('Alternative deadline check:', {
        deadlineFromString: deadlineFromString.toLocaleString(),
        distanceFromString,
        inHours: distanceFromString / (1000 * 60 * 60),
        inDays: distanceFromString / (1000 * 60 * 60 * 24)
      });

      // If the string-based deadline is in the future, use that instead
      if (distanceFromString > 0) {
        const days = Math.floor(distanceFromString / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distanceFromString % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distanceFromString % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distanceFromString % (1000 * 60)) / 1000);

        if (days > 0) {
          return `${days}d ${hours}h`;
        } else if (hours > 0) {
          return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`;
        } else {
          return `${seconds}s`;
        }
      }

      return 'Expired';
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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
>>>>>>> Stashed changes
  };

  // Check if bounty is expired
  const isExpired = () => {
    const deadline = new Date(bounty.deadline);
    const now = new Date();
    return now > deadline;
  };

  // Get status badge
  const getStatusBadge = () => {
    // If expired, show COMPLETED badge
    if (isExpired() && bounty.status.toUpperCase() !== BountyStatus.COMPLETED) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700/40 text-gray-300 border border-gray-600/30">
          COMPLETED
        </span>
      );
    }

    // Otherwise show regular status badge
    switch (bounty.status.toUpperCase()) {
      case BountyStatus.OPEN:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/30">
            {bounty.status.toUpperCase()}
          </span>
        );
      case BountyStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/30">
            {bounty.status.toUpperCase()}
          </span>
        );
      case BountyStatus.COMPLETED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700/40 text-gray-300 border border-gray-600/30">
            {bounty.status.toUpperCase()}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-300 border border-yellow-700/30">
            {bounty.status.toUpperCase()}
          </span>
        );
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

  // Format countdown display
  const formatCountdownDisplay = () => {
    if (countdown.expired) {
      return <span className="text-red-400">Expired</span>;
    }

    // For shorter display on cards
    if (countdown.days > 0) {
      return (
        <span>
          {countdown.days}d {countdown.hours}h {countdown.minutes}m
        </span>
      );
    }
    
    return (
      <span>
        {countdown.hours.toString().padStart(2, '0')}:
        {countdown.minutes.toString().padStart(2, '0')}:
        {countdown.seconds.toString().padStart(2, '0')}
      </span>
    );
  };

  return (
<<<<<<< Updated upstream
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        {getStatusBadge()}
        <span className="font-semibold text-green-300">{assetSymbol}{safeBounty.reward.amount} {safeBounty.reward.asset}</span>
      </div>

      <h3 className="text-xl font-semibold mb-2 text-white">{safeBounty.title}</h3>

      <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
        <FiBriefcase className="flex-shrink-0" />
        <span>{safeBounty.sponsorName || 'Anonymous'}</span>
      </div>

      <p className="text-gray-300 mb-4 line-clamp-2">{safeBounty.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {safeBounty.skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="bg-white/10 text-gray-200 px-2 py-1 rounded text-xs border border-white/10">
            {skill}
          </span>
        ))}
        {safeBounty.skills.length > 3 && (
          <span className="bg-white/10 text-gray-200 px-2 py-1 rounded text-xs border border-white/10">
            +{safeBounty.skills.length - 3} more
=======
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bounty.status as BountyStatus)}`}>
            {bounty.status.toUpperCase()}
          </span>
          <span className="font-medium text-green-300 bg-green-900/30 px-3 py-1 rounded-full border border-green-700/30">
            {assetSymbols[bounty.reward.asset] || ''}{bounty.reward.amount} {bounty.reward.asset}
>>>>>>> Stashed changes
          </span>
        </div>

<<<<<<< Updated upstream
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
                <Link href={`/bounties/${safeBounty.id}`} className="text-blue-400 hover:text-blue-300 text-sm block text-center mt-2">
                  View all winners
                </Link>
              )}
            </div>
=======
        <h3 className="text-xl font-semibold mb-3 text-white">{bounty.title}</h3>

        <p className="text-gray-300 mb-4 line-clamp-2">{bounty.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {bounty.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="bg-white/10 text-gray-200 px-3 py-1 rounded-full text-xs border border-white/10">
              {skill}
            </span>
          ))}
          {bounty.skills.length > 3 && (
            <span className="bg-white/10 text-gray-200 px-3 py-1 rounded-full text-xs border border-white/10">
              +{bounty.skills.length - 3} more
            </span>
>>>>>>> Stashed changes
          )}
        </div>

<<<<<<< Updated upstream
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
        <div className="text-sm">
          <div className="text-gray-300 mb-1">
            Deadline: <span className="font-medium text-white">{formatDeadline(safeBounty.deadline)}</span>
          </div>
          <div className={`flex items-center gap-1 font-mono ${countdown.expired ? 'text-red-400' : countdown.days > 0 ? 'text-green-300' : 'text-yellow-300'}`}>
            <FiClock className="flex-shrink-0" />
            {formatCountdownDisplay()}
          </div>
        </div>
        <Link href={`/bounties/${safeBounty.id}`} className="text-white hover:text-gray-300 font-medium transition-colors">
          View Details →
        </Link>
=======
        {/* Submission count */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
          <FiUsers className="text-gray-400" />
          <span>{submissionCount} {submissionCount === 1 ? 'submission' : 'submissions'}</span>
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
                      <div key={winner.position} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
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

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Deadline</span>
            <span className="font-medium text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10">{countdown}</span>
          </div>
          <Link 
            href={`/bounties/${bounty.id}`} 
            className="bg-white/10 text-white hover:bg-white/20 font-medium py-2 px-4 rounded-lg transition-colors border border-white/10"
          >
            View Details →
          </Link>
        </div>
>>>>>>> Stashed changes
      </div>
    </div>
  );
} 