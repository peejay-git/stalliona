import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mockBounties } from '@/utils/mock-data';
import { BountyStatus } from '@/types/bounty';

export default function BountyDetailPage({ params }: { params: { id: string } }) {
  // In a real app, this would fetch from the API/contract
  const bounty = mockBounties.find((b) => b.id === params.id);

  if (!bounty) {
    notFound();
  }

  // Format date to be more readable
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
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Open
          </span>
        );
      case BountyStatus.IN_PROGRESS:
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            In Progress
          </span>
        );
      case BountyStatus.REVIEW:
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            Under Review
          </span>
        );
      case BountyStatus.COMPLETED:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            Completed
          </span>
        );
      case BountyStatus.CANCELLED:
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500">
            <Link href="/bounties" className="hover:text-stellar-blue">
              Bounties
            </Link>{' '}
            / {bounty.title}
          </nav>
        </div>

        {/* Bounty header */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{bounty.title}</h1>
              <div className="flex items-center gap-3">
                {getStatusBadge(bounty.status)}
                <span className="text-gray-500 text-sm">
                  Posted on {formatDate(bounty.created)}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-stellar-blue to-stellar-purple text-white py-3 px-6 rounded-lg text-center">
              <div className="text-sm opacity-90">Reward</div>
              <div className="text-xl font-bold">
                ${bounty.reward.amount} {bounty.reward.asset}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Category</h3>
                <p className="font-medium">{bounty.category}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Deadline</h3>
                <p className="font-medium">{formatDate(bounty.deadline)}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Posted By</h3>
                <p className="font-medium text-stellar-blue truncate">
                  {bounty.owner.slice(0, 6)}...{bounty.owner.slice(-4)}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm text-gray-500 mb-1">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {bounty.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bounty description */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line">{bounty.description}</p>
          </div>
        </div>

        {/* Apply section */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-xl font-semibold mb-4">Submit Work</h2>
          {bounty.status === BountyStatus.OPEN || bounty.status === BountyStatus.IN_PROGRESS ? (
            <div>
              <p className="text-gray-600 mb-6">
                To apply for this bounty, you'll need to connect your Stellar wallet and provide details about your submission.
              </p>
              <div className="mb-6">
                <label htmlFor="submission" className="block text-gray-700 font-medium mb-2">
                  Submission Details
                </label>
                <textarea
                  id="submission"
                  rows={6}
                  className="input"
                  placeholder="Explain your approach, provide links to your work, or add any relevant details..."
                ></textarea>
              </div>
              <button className="btn-primary">Submit Work</button>
            </div>
          ) : (
            <p className="text-gray-600">
              This bounty is {bounty.status.toLowerCase()} and is not accepting submissions at this time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 