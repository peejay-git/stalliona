'use client';
import Link from 'next/link';
import { BountyCard } from '@/components/BountyCard';
import { BountyFilter } from '@/components/BountyFilter';
// import { mockBounties } from '@/utils/mock-data';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { getAllBounties, getFilteredBounties } from '@/lib/bounties';
import { BountyCardSkeleton } from '@/components/BountyCardSkeleton';
import { BountyCategory, BountyStatus } from '@/types/bounty';

export default function BountiesPage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState<BountyStatus[]>([
    BountyStatus.OPEN,
    BountyStatus.IN_PROGRESS,
  ]);
  const [categoryFilters, setCategoryFilters] = useState<BountyCategory[]>([]);
  const [rewardRange, setRewardRange] = useState<{ min: number; max: number | null }>({ min: 0, max: null });
  const [skills, setSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 2; // you can adjust this number

  const applyFilters = async () => {
    setLoading(true);

    const filtered = await getFilteredBounties({
      statusFilters: statusFilters.map((status) => status as 'OPEN' | 'CLOSE'),
      categoryFilters,
      rewardRange: {
        min: rewardRange.min,
        max: rewardRange.max ?? undefined,
      },
      skills,
    });
    setBounties(filtered);
    setLoading(false);
  };

  // useEffect(() => {
  //   applyFilters();
  // }, []);

  const onReset = () => {
    setLoading(true);
    getAllBounties()
      .then(setBounties)
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    getAllBounties()
      .then(setBounties)
      .finally(() => setLoading(false));
  }, []);

  const filteredAndSorted = [...bounties]
    .filter((bounty) =>
      bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounty.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'reward-high':
          return Number(b.rewardAmount) - Number(a.rewardAmount);
        case 'reward-low':
          return Number(a.rewardAmount) - Number(b.rewardAmount);
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'newest':
        default:
          return new Date(b.createdAt.seconds * 1000).getTime() - new Date(a.createdAt.seconds * 1000).getTime();
      }
    });

  return (
    <Layout>
      <div className="min-h-screen pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          {/* Header section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Explore Bounties</h1>
            <p className="text-gray-300 max-w-3xl">
              Find and apply for bounties that match your skills. Projects are looking for developers, designers, and content creators to help build on the Stellar ecosystem.
            </p>
          </div>

          {/* Mobile filter toggle */}
          <div className="lg:hidden flex justify-between items-center mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4h12m-12 0V8m30 0v8"
                />
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300 whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/10 border-white/20 text-white rounded-lg text-sm px-2 py-1.5"
              >
                <option value="newest">Newest</option>
                <option value="reward-high">Highest Reward</option>
                <option value="reward-low">Lowest Reward</option>
                <option value="deadline">Deadline (Soon)</option>
              </select>
            </div>
          </div>

          {/* Search and filter section */}
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {/* Filter sidebar */}
            <div className={`lg:w-1/4 ${showFilters || window.innerWidth >= 1024 ? 'block' : 'hidden'}`}>
              <BountyFilter statusFilters={statusFilters}
                categoryFilters={categoryFilters}
                rewardRange={rewardRange}
                skills={skills}
                setStatusFilters={setStatusFilters}
                setCategoryFilters={setCategoryFilters}
                setRewardRange={setRewardRange}
                setSkills={setSkills}
                onApply={() => {
                  applyFilters();
                  if (window.innerWidth < 1024) setShowFilters(false);
                }} 
                onReset={onReset} />
            </div>

            {/* Bounty listing */}
            <div className="lg:w-3/4">
              {/* Search bar and desktop sorting options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-md">
                  <input
                    type="text"
                    placeholder="Search bounties..."
                    className="input pl-10 w-full bg-white/10 border-white/20 text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-sm text-gray-300 whitespace-nowrap">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/10 border-white/20 text-white rounded-lg text-sm px-2 py-1.5"
                  >
                    <option value="newest">Newest</option>
                    <option value="reward-high">Highest Reward</option>
                    <option value="reward-low">Lowest Reward</option>
                    <option value="deadline">Deadline (Soon)</option>
                  </select>
                </div>
              </div>

              {/* Bounty count */}
              <div className="mb-6">
                <p className="text-gray-300">
                  Showing <span className="font-medium text-white">{bounties.length}</span> bounties
                </p>
              </div>

              {/* Bounty cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => <BountyCardSkeleton key={i} />)
                  : bounties.length === 0 ? (
                    <p className="text-center text-white">No bounties found</p>
                  ) : filteredAndSorted
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((bounty) => <BountyCard key={bounty.id} bounty={bounty} />)
                }
              </div>
              {filteredAndSorted.length > itemsPerPage && (
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: Math.ceil(filteredAndSorted.length / itemsPerPage) }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-1 rounded-lg text-sm ${currentPage === i + 1
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}

                </div>
              )}

              {/* Create bounty CTA */}
              <div className="mt-12 pt-8 border-t border-gray-600">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8 text-center text-white">
                  <h3 className="text-xl font-bold mb-3">Have a project that needs talent?</h3>
                  <p className="mb-6 opacity-90">
                    Create a bounty to find the perfect contributor for your Stellar project.
                  </p>
                  <Link href="/create" className="bg-white text-black font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors">
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