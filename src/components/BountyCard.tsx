import Link from 'next/link';
import { Bounty, BountyStatus } from '@/types/bounty';

interface BountyCardProps {
  bounty: Bounty;
}
export const assetSymbols: Record<string, string> = {
  USDC: '$',
  XLM: '★',
  EURC: '€',
};
export function BountyCard({ bounty }: BountyCardProps) {
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
      case BountyStatus.REVIEW:
        return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30';
      case BountyStatus.COMPLETED:
        return 'bg-gray-700/40 text-gray-300 border border-gray-600/30';
      case BountyStatus.CANCELLED:
        return 'bg-red-900/40 text-red-300 border border-red-700/30';
      default:
        return 'bg-gray-700/40 text-gray-300 border border-gray-600/30';
    }
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