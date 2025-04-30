'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BountyCategory } from '@/types/bounty';
import { useWallet } from '@/hooks/useWallet';

export default function CreateBountyPage() {
  const router = useRouter();
  const { isConnected, publicKey } = useWallet();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardAmount: '',
    rewardAsset: 'USDC',
    deadline: '',
    category: '' as BountyCategory,
    skills: [] as string[],
    skillInput: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add a skill tag
  const addSkill = () => {
    const skill = formData.skillInput.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
        skillInput: '',
      });
    }
  };

  // Remove a skill tag
  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  // Handle skill input key press (enter to add)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    if (!formData.rewardAmount || parseFloat(formData.rewardAmount) <= 0) {
      setError('Reward amount must be greater than zero');
      return;
    }
    
    if (!formData.deadline) {
      setError('Deadline is required');
      return;
    }
    
    if (!formData.category) {
      setError('Category is required');
      return;
    }
    
    if (formData.skills.length === 0) {
      setError('At least one skill is required');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // In a real app, this would interact with the smart contract
      console.log('Creating bounty with data:', formData);
      
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Redirect to bounties page on success
      router.push('/bounties');
    } catch (err) {
      console.error('Error creating bounty:', err);
      setError('Failed to create bounty. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create a Bounty</h1>

        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-700">
              You need to connect your Stellar wallet to create a bounty. The bounty reward will be locked in the smart contract.
            </p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                placeholder="E.g., Build a Stellar Wallet Integration"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="input"
                placeholder="Provide a detailed description of the bounty requirements..."
                required
              ></textarea>
            </div>

            {/* Reward */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="rewardAmount" className="block text-gray-700 font-medium mb-2">
                  Reward Amount*
                </label>
                <input
                  type="number"
                  id="rewardAmount"
                  name="rewardAmount"
                  value={formData.rewardAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="500"
                  required
                />
              </div>
              <div>
                <label htmlFor="rewardAsset" className="block text-gray-700 font-medium mb-2">
                  Asset Type*
                </label>
                <select
                  id="rewardAsset"
                  name="rewardAsset"
                  value={formData.rewardAsset}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="USDC">USDC</option>
                  <option value="XLM">XLM</option>
                  <option value="EURC">EURC</option>
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div className="mb-6">
              <label htmlFor="deadline" className="block text-gray-700 font-medium mb-2">
                Deadline*
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={getMinDate()}
                className="input"
                required
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select a category</option>
                {Object.values(BountyCategory).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Skills */}
            <div className="mb-8">
              <label htmlFor="skillInput" className="block text-gray-700 font-medium mb-2">
                Required Skills*
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="skillInput"
                  name="skillInput"
                  value={formData.skillInput}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className="input flex-grow"
                  placeholder="E.g., React, Rust, Soroban"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="btn-secondary whitespace-nowrap"
                >
                  Add Skill
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {formData.skills.length === 0 && (
                  <span className="text-gray-400 text-sm">
                    Add at least one required skill
                  </span>
                )}
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary py-2 px-8"
                disabled={isSubmitting || !isConnected}
              >
                {isSubmitting ? 'Creating...' : 'Create Bounty'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 