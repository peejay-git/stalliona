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
        return 'bg-green-100 text-green-800';
      case BountyStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case BountyStatus.REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case BountyStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case BountyStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bounty.status as BountyStatus)}`}>
          {bounty.status.toUpperCase()}
        </span>
        <span className="font-semibold text-green-600">{assetSymbols[bounty.reward.asset] || ''}{bounty.reward.amount} {bounty.reward.asset}</span>
      </div>

      <h3 className="text-xl font-semibold mb-2">{bounty.title}</h3>

      <p className="text-gray-600 mb-4 line-clamp-2">{bounty.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {bounty.skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            {skill}
          </span>
        ))}
        {bounty.skills.length > 3 && (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            +{bounty.skills.length - 3} more
          </span>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-500">
          Deadline: <span className="font-medium">{formatDeadline(bounty.deadline)}</span>
        </span>
        <Link href={`/bounties/${bounty.id}`} className="text-stellar-blue hover:underline font-medium">
          View Details →
        </Link>
      </div>
    </div>
  );
} 