'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BountyCategory } from '@/types/bounty';
import { useWallet } from '@/hooks/useWallet';
import toast from 'react-hot-toast';
import { useUserStore } from '@/lib/stores/useUserStore';
import { saveBounty } from '@/lib/bounties';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { IoWalletOutline, IoTimeOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { FiEdit, FiDollarSign, FiCalendar, FiTag, FiBookmark, FiArrowRight, FiArrowLeft, FiX, FiPlusCircle, FiInfo } from 'react-icons/fi';

type FormStep = 'details' | 'rewards' | 'requirements' | 'review';

export default function CreateBountyPage() {
  const router = useRouter();
  const { isConnected, publicKey } = useWallet();
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const user = useUserStore((state) => state.user);

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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWalletWarning, setShowWalletWarning] = useState(!isConnected);
  
  // Update wallet warning when connection status changes
  useEffect(() => {
    setShowWalletWarning(!isConnected);
  }, [isConnected]);

  // Calculate minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
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
      
      // Clear skills error if any
      if (errors.skills) {
        setErrors({ ...errors, skills: '' });
      }
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

  // Validate the current step
  const validateStep = (step: FormStep): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (step === 'details') {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
        isValid = false;
      }
      
      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
        isValid = false;
      } else if (formData.description.trim().length < 50) {
        newErrors.description = 'Description should be at least 50 characters';
        isValid = false;
      }
      
      if (!formData.category) {
        newErrors.category = 'Category is required';
        isValid = false;
      }
    } 
    else if (step === 'rewards') {
      if (!formData.rewardAmount || parseFloat(formData.rewardAmount) <= 0) {
        newErrors.rewardAmount = 'Reward amount must be greater than zero';
        isValid = false;
      }
      
      if (!formData.deadline) {
        newErrors.deadline = 'Deadline is required';
        isValid = false;
      }
    }
    else if (step === 'requirements') {
      if (formData.skills.length === 0) {
        newErrors.skills = 'At least one skill is required';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Move to the next step
  const handleNextStep = () => {
    const isValid = validateStep(currentStep);
    if (!isValid) return;

    if (currentStep === 'details') setCurrentStep('rewards');
    else if (currentStep === 'rewards') setCurrentStep('requirements');
    else if (currentStep === 'requirements') setCurrentStep('review');
  };

  // Move to the previous step
  const handlePrevStep = () => {
    if (currentStep === 'rewards') setCurrentStep('details');
    else if (currentStep === 'requirements') setCurrentStep('rewards');
    else if (currentStep === 'review') setCurrentStep('requirements');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation of all steps
    if (!validateStep('details') || !validateStep('rewards') || !validateStep('requirements')) {
      toast.error('Please correct the errors before submitting');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet to create a bounty');
      return;
    }

    if (!user || user.role !== 'sponsor') {
      toast.error('Only sponsors can create bounties');
      return;
    }

    setIsSubmitting(true);

    try {
      const bountyData = {
        ...formData,
        reward: {
          amount: formData.rewardAmount,
          asset: formData.rewardAsset,
        },
        status: 'open',
        owner: user.uid,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      await saveBounty(bountyData);
      toast.success('Bounty created successfully!');
      router.push('/bounties');
    } catch (err: any) {
      console.error('Failed to create bounty:', err);
      let message = 'Failed to create bounty';

      if (err.code && err.message) {
        // Firebase error
        message = err.message;
      } else if (err?.response?.data?.message) {
        // Backend error
        message = err.response.data.message;
      } else if (err.message) {
        // Generic JS error
        message = err.message;
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form steps
  const renderFormStep = () => {
    switch (currentStep) {
      case 'details':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label htmlFor="title" className="block text-white font-medium">
                Title*
              </label>
              <div className="relative">
                <FiEdit className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`input pl-10 w-full ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="E.g., Build a Stellar Wallet Integration"
                />
              </div>
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="block text-white font-medium">
                Category*
              </label>
              <div className="relative">
                <FiBookmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`input pl-10 w-full appearance-none ${errors.category ? 'border-red-500' : ''}`}
                >
                  <option value="">Select a category</option>
                  {Object.values(BountyCategory).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="description" className="block text-white font-medium">
                  Description*
                </label>
                <span className="text-sm text-gray-400">
                  {formData.description.length} characters (min 50)
                </span>
              </div>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={8}
                className={`input w-full ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Provide a detailed description of the bounty requirements, expectations, deliverables, and any other relevant information."
              ></textarea>
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>
          </motion.div>
        );

      case 'rewards':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-6">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Reward Information</h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="rewardAmount" className="block text-white font-medium">
                      Reward Amount*
                    </label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        id="rewardAmount"
                        name="rewardAmount"
                        value={formData.rewardAmount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className={`input pl-10 w-full ${errors.rewardAmount ? 'border-red-500' : ''}`}
                        placeholder="500"
                      />
                    </div>
                    {errors.rewardAmount && <p className="text-red-400 text-sm mt-1">{errors.rewardAmount}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="rewardAsset" className="block text-white font-medium">
                      Asset Type*
                    </label>
                    <div className="relative">
                      <select
                        id="rewardAsset"
                        name="rewardAsset"
                        value={formData.rewardAsset}
                        onChange={handleChange}
                        className="input w-full"
                      >
                        <option value="USDC">USDC</option>
                        <option value="XLM">XLM</option>
                        <option value="EURC">EURC</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Timeline</h3>
                
                <div className="space-y-2">
                  <label htmlFor="deadline" className="block text-white font-medium">
                    Deadline*
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      min={getMinDate()}
                      className={`input pl-10 w-full ${errors.deadline ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.deadline && <p className="text-red-400 text-sm mt-1">{errors.deadline}</p>}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'requirements':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Required Skills</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="skillInput" className="block text-white font-medium">
                    Add Skills*
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        id="skillInput"
                        name="skillInput"
                        value={formData.skillInput}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        className={`input pl-10 w-full ${errors.skills ? 'border-red-500' : ''}`}
                        placeholder="E.g., React, Rust, Soroban"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-2 px-4 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <FiPlusCircle />
                      Add
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.skills.map((skill) => (
                      <motion.span
                        key={skill}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white/10 text-white px-3 py-1 rounded-full text-sm flex items-center border border-white/10"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <FiX />
                        </button>
                      </motion.span>
                    ))}
                    {formData.skills.length === 0 && (
                      <span className="text-gray-400 text-sm flex items-center gap-2">
                        <FiInfo /> Add at least one required skill
                      </span>
                    )}
                  </div>
                  {errors.skills && <p className="text-red-400 text-sm mt-3">{errors.skills}</p>}
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-blue-300">
              <p className="flex items-center gap-2">
                <FiInfo className="flex-shrink-0" />
                <span>
                  Adding relevant and specific skills will help attract the right talent for your bounty.
                </span>
              </p>
            </div>
          </motion.div>
        );

      case 'review':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Bounty Overview</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Title</h4>
                    <p className="text-white">{formData.title}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Category</h4>
                    <p className="text-white">{formData.category}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Description</h4>
                  <p className="text-white whitespace-pre-wrap">{formData.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Reward</h4>
                    <p className="text-white text-xl font-semibold">
                      {formData.rewardAmount} {formData.rewardAsset}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Deadline</h4>
                    <p className="text-white">
                      {new Date(formData.deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Required Skills</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-white/10 text-white px-3 py-1 rounded-full text-sm border border-white/10"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {!isConnected && (
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 text-yellow-300">
                <p className="flex items-center gap-2">
                  <IoWalletOutline className="flex-shrink-0 text-lg" />
                  <span>
                    You need to connect your wallet to create this bounty.
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        );
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-6 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-2 text-white">Create a Bounty</h1>
          <p className="text-gray-400 mb-8">Create a bounty to find and reward talent in the Stellar ecosystem.</p>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between">
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'details' || currentStep === 'rewards' || currentStep === 'requirements' || currentStep === 'review'
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white'
                }`}>
                  <FiEdit className="w-4 h-4" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-white">Details</span>
              </div>
              <div className="flex-1 mx-4 border-t border-white/20 self-center"></div>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'rewards' || currentStep === 'requirements' || currentStep === 'review'
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white'
                }`}>
                  <FiDollarSign className="w-4 h-4" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-white">Rewards</span>
              </div>
              <div className="flex-1 mx-4 border-t border-white/20 self-center"></div>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'requirements' || currentStep === 'review'
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white'
                }`}>
                  <FiTag className="w-4 h-4" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-white">Requirements</span>
              </div>
              <div className="flex-1 mx-4 border-t border-white/20 self-center"></div>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'review'
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white'
                }`}>
                  <IoCheckmarkCircleOutline className="w-4 h-4" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-white">Review</span>
              </div>
            </div>
          </div>

          {showWalletWarning && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-6 text-yellow-300 flex items-start gap-3"
            >
              <IoWalletOutline className="flex-shrink-0 text-xl mt-0.5" />
              <div>
                <p className="font-medium mb-1">Wallet Connection Required</p>
                <p className="text-sm">
                  You'll need to connect your Stellar wallet to create a bounty. The bounty reward will be locked in a smart contract until the work is completed and accepted.
                </p>
              </div>
              <button 
                onClick={() => setShowWalletWarning(false)} 
                className="flex-shrink-0 p-1 text-yellow-300 hover:text-yellow-100 transition-colors"
              >
                <FiX />
              </button>
            </motion.div>
          )}

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 mb-6">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {renderFormStep()}
              </AnimatePresence>

              <div className="flex justify-between pt-6 mt-6 border-t border-white/10">
                {currentStep !== 'details' ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-white/10 text-white font-medium py-2 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    <FiArrowLeft />
                    <span>Back</span>
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep !== 'review' ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-white text-black font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2"
                  >
                    <span>Continue</span>
                    <FiArrowRight />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !isConnected}
                    className={`${isConnected ? 'bg-white text-black' : 'bg-white/50 text-black/70 cursor-not-allowed'} font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
                        </span>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Bounty</span>
                        {!isConnected && <IoWalletOutline />}
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-blue-900/10 border border-blue-700/20 rounded-lg p-4 text-blue-300 text-sm">
            <div className="flex gap-2 items-start">
              <IoTimeOutline className="flex-shrink-0 text-xl mt-0.5" />
              <div>
                <p className="font-medium">Tips for creating an effective bounty:</p>
                <ul className="mt-2 space-y-1 list-disc pl-5">
                  <li>Be specific about requirements and expectations</li>
                  <li>Set a realistic deadline and reward amount</li>
                  <li>Include all necessary details and context</li>
                  <li>List specific required skills to attract the right talent</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 