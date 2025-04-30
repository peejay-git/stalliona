'use client';

import { useState } from 'react';
import { BountyCategory, BountyStatus } from '@/types/bounty';

export function BountyFilter() {
  const [statusFilters, setStatusFilters] = useState<BountyStatus[]>([
    BountyStatus.OPEN,
    BountyStatus.IN_PROGRESS,
  ]);
  
  const [categoryFilters, setCategoryFilters] = useState<BountyCategory[]>([]);
  
  const [rewardRange, setRewardRange] = useState<{ min: number; max: number | null }>({
    min: 0,
    max: null,
  });

  // Toggle status filter
  const toggleStatus = (status: BountyStatus) => {
    if (statusFilters.includes(status)) {
      setStatusFilters(statusFilters.filter((s) => s !== status));
    } else {
      setStatusFilters([...statusFilters, status]);
    }
  };

  // Toggle category filter
  const toggleCategory = (category: BountyCategory) => {
    if (categoryFilters.includes(category)) {
      setCategoryFilters(categoryFilters.filter((c) => c !== category));
    } else {
      setCategoryFilters([...categoryFilters, category]);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilters([BountyStatus.OPEN, BountyStatus.IN_PROGRESS]);
    setCategoryFilters([]);
    setRewardRange({ min: 0, max: null });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-stellar-blue hover:underline"
        >
          Reset
        </button>
      </div>

      {/* Status filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Status</h4>
        <div className="space-y-2">
          {Object.values(BountyStatus).map((status) => (
            <div key={status} className="flex items-center">
              <input
                type="checkbox"
                id={`status-${status}`}
                checked={statusFilters.includes(status)}
                onChange={() => toggleStatus(status)}
                className="h-4 w-4 rounded border-gray-300 text-stellar-blue focus:ring-stellar-blue"
              />
              <label htmlFor={`status-${status}`} className="ml-2 text-gray-600">
                {status}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Category</h4>
        <div className="space-y-2">
          {Object.values(BountyCategory).map((category) => (
            <div key={category} className="flex items-center">
              <input
                type="checkbox"
                id={`category-${category}`}
                checked={categoryFilters.includes(category)}
                onChange={() => toggleCategory(category)}
                className="h-4 w-4 rounded border-gray-300 text-stellar-blue focus:ring-stellar-blue"
              />
              <label htmlFor={`category-${category}`} className="ml-2 text-gray-600">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Reward range filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Reward Range</h4>
        <div className="space-y-4">
          <div>
            <label htmlFor="min-reward" className="block text-sm text-gray-600 mb-1">
              Min Reward ($)
            </label>
            <input
              type="number"
              id="min-reward"
              min="0"
              value={rewardRange.min}
              onChange={(e) => setRewardRange({ ...rewardRange, min: Number(e.target.value) })}
              className="input py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="max-reward" className="block text-sm text-gray-600 mb-1">
              Max Reward ($)
            </label>
            <input
              type="number"
              id="max-reward"
              min="0"
              value={rewardRange.max || ''}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setRewardRange({ ...rewardRange, max: value });
              }}
              className="input py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Skills filter */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Skills</h4>
        <input
          type="text"
          placeholder="Search skills..."
          className="input py-1.5 text-sm mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {['Rust', 'JavaScript', 'React', 'Soroban', 'Smart Contracts'].map((skill) => (
            <span
              key={skill}
              className="bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-600 px-2 py-1 rounded text-xs"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Apply filters button */}
      <button className="btn-primary w-full mt-8">Apply Filters</button>
    </div>
  );
} 