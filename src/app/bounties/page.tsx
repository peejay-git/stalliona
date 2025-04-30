import Link from 'next/link';
import { BountyCard } from '@/components/BountyCard';
import { BountyFilter } from '@/components/BountyFilter';
import { mockBounties } from '@/utils/mock-data';
import Layout from '@/components/Layout';

export default function BountiesPage() {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          {/* Header section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Explore Bounties</h1>
            <p className="text-gray-600 max-w-3xl">
              Find and apply for bounties that match your skills. Projects are looking for developers, designers, and content creators to help build on the Stellar ecosystem.
            </p>
          </div>

          {/* Search and filter section */}
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {/* Filter sidebar */}
            <div className="lg:w-1/4">
              <BountyFilter />
            </div>

            {/* Bounty listing */}
            <div className="lg:w-3/4">
              {/* Search bar and sorting options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-md">
                  <input
                    type="text"
                    placeholder="Search bounties..."
                    className="input pl-10 w-full"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
                  <select className="border border-gray-300 rounded-lg text-gray-600 text-sm px-2 py-1.5">
                    <option value="newest">Newest</option>
                    <option value="reward-high">Highest Reward</option>
                    <option value="reward-low">Lowest Reward</option>
                    <option value="deadline">Deadline (Soon)</option>
                  </select>
                </div>
              </div>

              {/* Bounty count */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing <span className="font-medium text-gray-900">{mockBounties.length}</span> bounties
                </p>
              </div>

              {/* Bounty cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockBounties.map((bounty) => (
                  <BountyCard key={bounty.id} bounty={bounty} />
                ))}
              </div>

              {/* Create bounty CTA */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="bg-gradient-to-r from-stellar-blue to-stellar-purple rounded-xl p-8 text-center text-white">
                  <h3 className="text-xl font-bold mb-3">Have a project that needs talent?</h3>
                  <p className="mb-6 opacity-90">
                    Create a bounty to find the perfect contributor for your Stellar project.
                  </p>
                  <Link href="/create" className="bg-white text-stellar-blue font-medium py-2 px-6 rounded-lg hover:bg-opacity-90 transition-opacity">
                    Create a Bounty
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 