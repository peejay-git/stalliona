import { SorobanService } from '@/lib/soroban';
import { Distribution } from '@/types/bounty';
import { createBountyOnChain } from '@/utils/blockchain';
import freighterApi from '@stellar/freighter-api';
import { useState } from 'react';

export default function CreateBountyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<
    'form' | 'blockchain' | 'database' | 'complete'
  >('form');
  const [blockchainBountyId, setBlockchainBountyId] = useState<number | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: `# Project Overview
Briefly describe what this bounty is about.

# Requirements
- Requirement 1
- Requirement 2
- Requirement 3

# Deliverables
- What should be delivered upon completion
- Specific formats or files required

# Timeline
- Expected milestones or checkpoints
- Any important dates to note

# Additional Information
Any other details that might be helpful for the talent working on this bounty.`,
    category: 'DEVELOPMENT',
    skills: [] as string[],
    token: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', // Default to USDC address
    tokenSymbol: 'USDC', // Track the token symbol separately for display
    rewardAmount: '',
    submissionDeadline: '',
    judgingDeadline: '',
    distribution: [{ percentage: 100, position: 1 }] as Distribution[],
    winnerCount: 1,
  });

  // Available tokens with their details
  const availableTokens = [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      logo: '/images/tokens/usdc.svg',
      address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    },
    {
      symbol: 'NGNC',
      name: 'NGNC',
      logo: '/images/tokens/ngnc.svg',
      address: 'CBYFV4W2LTMXYZ3XWFX5BK2BY255DU2DSXNAE4FJ5A5VYUWGIBJDOIGG',
    },
    {
      symbol: 'KALE',
      name: 'KALE',
      logo: '/images/tokens/kale.svg',
      address: 'CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV',
    },
    {
      symbol: 'XLM',
      name: 'Stellar Lumens',
      logo: '/images/tokens/xlm.svg',
      address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    },
  ];

  // Available skills for skill selection
  const skillsOptions = [
    'JavaScript',
    'React',
    'Node.js',
    'Solidity',
    'Blockchain',
    'Smart Contracts',
    'Python',
    'UI/UX',
    'Graphic Design',
    'Writing',
    'Marketing',
    'Community Management',
    'Translation',
    'Research',
    'Rust',
    'Stellar'
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'winnerCount') {
      const count = parseInt(value);
      if (count >= 1 && count <= 5) {
        // Create new distribution based on winner count
        const newDistribution = Array.from({ length: count }, (_, i) => {
          const position = i + 1;
          // For existing positions, keep their percentage if available
          const existingEntry = formData.distribution.find(
            (d) => d.position === position
          );
          return {
            position,
            percentage:
              existingEntry?.percentage ||
              calculateDefaultPercentage(count, position),
          };
        });

        setFormData((prev) => ({
          ...prev,
          winnerCount: count,
          distribution: newDistribution,
        }));
      }
    } else if (name === 'token') {
      // When token changes, update both token (address) and tokenSymbol
      const selectedToken = availableTokens.find(t => t.address === value);
      if (selectedToken) {
        setFormData((prev) => ({
          ...prev,
          token: value,
          tokenSymbol: selectedToken.symbol
        }));
      } else {
        // Fallback if token not found
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDistributionChange = (position: number, percentage: number) => {
    const newDistribution = formData.distribution.map((item) => {
      if (item.position === position) {
        return { ...item, percentage };
      }
      return item;
    });

    setFormData((prev) => ({
      ...prev,
      distribution: newDistribution,
    }));
  };

  const calculateDefaultPercentage = (
    totalWinners: number,
    position: number
  ): number => {
    // Default percentage distribution based on position
    switch (totalWinners) {
      case 1:
        return 100;
      case 2:
        return position === 1 ? 70 : 30;
      case 3:
        return position === 1 ? 50 : position === 2 ? 30 : 20;
      case 4:
        return position === 1
          ? 40
          : position === 2
          ? 30
          : position === 3
          ? 20
          : 10;
      case 5:
        return position === 1
          ? 40
          : position === 2
          ? 25
          : position === 3
          ? 15
          : position === 4
          ? 10
          : 10;
      default:
        return 100 / totalWinners;
    }
  };

  const validateDistribution = (): boolean => {
    const total = formData.distribution.reduce(
      (sum, item) => sum + item.percentage,
      0
    );
    return total === 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the distribution percentages sum to 100%
    if (!validateDistribution()) {
      alert('The sum of reward distribution percentages must equal 100%');
      return;
    }
    
    // Validate skills selection
    if (formData.skills.length === 0) {
      alert('Please select at least one skill');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Check if wallet is connected
      const connected = await freighterApi.isConnected();
      if (!connected) {
        throw new Error('Wallet not connected');
      }

      // Step 2: Get the user's public key
      const userPublicKey = await freighterApi.getPublicKey();

      // Step 3: Update UI state
      setStep('blockchain');

      // Step 4: Create bounty on the blockchain
      let bountyId;
      try {
        bountyId = await createBountyOnChain({
          userPublicKey,
          title: formData.title,
          token: formData.token, // This is now the token address
          reward: {
            amount: formData.rewardAmount,
            asset: formData.tokenSymbol, // Use the token symbol for display
          },
          distribution: formData.distribution,
          submissionDeadline: new Date(formData.submissionDeadline).getTime(),
          judgingDeadline: new Date(formData.judgingDeadline).getTime(),
        });

        // Step 5: Store blockchain bounty ID
        console.log("Blockchain bounty ID received:", bountyId, typeof bountyId);
        setBlockchainBountyId(bountyId);
        console.log("blockchainBountyId state after setting:", blockchainBountyId, typeof blockchainBountyId);
      } catch (blockchainError) {
        // If there's a blockchain error, we need to handle it appropriately
        console.error('Blockchain error:', blockchainError);
        // Reset back to form if user declined or there was an error
        setStep('form');
        setIsLoading(false);
        return; // Exit early so we don't proceed to database step
      }

      // Step 6: Update UI state
      setStep('database');

      // Step 7: Save off-chain data to the database
      console.log("Before API call - blockchainBountyId:", bountyId, typeof bountyId);
      
      const requestBody = {
        blockchainBountyId: bountyId, // Use bountyId directly instead of the state variable
        description: formData.description,
        category: formData.category,
        skills: Array.isArray(formData.skills) && formData.skills.length > 0 ? formData.skills : ['General'],
        extraRequirements: '',
        owner: userPublicKey, // Add the owner's public key explicitly
        title: formData.title, // Explicitly include title
        reward: {
          amount: formData.rewardAmount,
          asset: formData.tokenSymbol
        }, // Explicitly include reward
        deadline: new Date(formData.submissionDeadline).toISOString(), // Add deadline
      };
      
      console.log("API request body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/bounties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API error response:", error);
        throw new Error(error.message || 'Failed to save bounty data');
      }

      // Step 8: Complete
      setStep('complete');
    } catch (error) {
      console.error('Error creating bounty:', error);
      alert('Failed to create bounty: ' + (error as Error).message);
      // Reset back to form
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle skill toggle
  const handleSkillToggle = (skill: string) => {
    setFormData(prev => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill];
      
      return {
        ...prev,
        skills
      };
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white/10 backdrop-blur-xl rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Bounty</h2>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-white mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white h-32"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-white mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
              required
            >
              <option value="DEVELOPMENT">Development</option>
              <option value="DESIGN">Design</option>
              <option value="MARKETING">Marketing</option>
              <option value="RESEARCH">Research</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-white mb-2">Skills Required</label>
            <div className="flex flex-wrap gap-2">
              {skillsOptions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                    formData.skills.includes(skill)
                      ? 'bg-blue-500/30 text-blue-200 border-blue-500/50'
                      : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                  }`}
                >
                  {skill} {formData.skills.includes(skill) ? '✓' : '+'}
                </button>
              ))}
            </div>
            {formData.skills.length === 0 && (
              <p className="text-xs text-amber-400 mt-2">
                Please select at least one skill.
              </p>
            )}
          </div>

          {/* Token and Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">Token</label>
              <div className="relative">
                <select
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white appearance-none"
                  required
                >
                  {availableTokens.map((token) => (
                    <option key={token.symbol} value={token.address}>
                      {token.name} ({token.symbol})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <img
                    src={
                      availableTokens.find((t) => t.address === formData.token)
                        ?.logo || '/images/tokens/usdc.svg'
                    }
                    alt={formData.tokenSymbol}
                    className="h-5 w-5 rounded-full"
                  />
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                USDC is recommended for best compatibility with the Stellar
                network.
              </p>
            </div>
            <div>
              <label className="block text-white mb-2">Reward Amount</label>
              <div className="relative">
                <input
                  type="number"
                  name="rewardAmount"
                  value={formData.rewardAmount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white pr-16"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-300 pointer-events-none bg-white/5 border-l border-white/20 rounded-r-lg">
                  {formData.tokenSymbol}
                </div>
              </div>
            </div>
          </div>

          {/* Winner Count and Distribution */}
          <div>
            <label className="block text-white mb-2">Number of Winners</label>
            <select
              name="winnerCount"
              value={formData.winnerCount}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              <option value={1}>1 Winner</option>
              <option value={2}>2 Winners</option>
              <option value={3}>3 Winners</option>
              <option value={4}>4 Winners</option>
              <option value={5}>5 Winners</option>
            </select>
          </div>

          {/* Distribution Percentages */}
          <div>
            <label className="block text-white mb-2">Reward Distribution</label>
            <div className="space-y-3 mt-3">
              {formData.distribution.map((dist) => (
                <div key={dist.position} className="flex items-center gap-3">
                  <div className="w-24 flex-shrink-0">
                    <span className="text-white">
                      {dist.position === 1
                        ? '1st Place'
                        : dist.position === 2
                        ? '2nd Place'
                        : dist.position === 3
                        ? '3rd Place'
                        : `${dist.position}th Place`}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={dist.percentage}
                    onChange={(e) =>
                      handleDistributionChange(
                        dist.position,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-20 bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-white text-center"
                  />
                  <span className="text-white">%</span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-white">Total:</span>
                <span
                  className={`font-medium ${
                    validateDistribution() ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formData.distribution.reduce(
                    (sum, item) => sum + item.percentage,
                    0
                  )}
                  %{!validateDistribution() && ' (Must equal 100%)'}
                </span>
              </div>
            </div>
          </div>

          {/* Deadlines */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">
                Submission Deadline
              </label>
              <input
                type="datetime-local"
                name="submissionDeadline"
                value={formData.submissionDeadline}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Judging Deadline</label>
              <input
                type="datetime-local"
                name="judgingDeadline"
                value={formData.judgingDeadline}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !validateDistribution()}
            className={`w-full font-medium py-3 rounded-lg transition-colors ${
              validateDistribution()
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/50 text-black/70 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Creating Bounty...' : 'Create Bounty'}
          </button>

          {/* Debug button - visible only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const connected = await freighterApi.isConnected();
                    if (!connected) {
                      alert('Wallet not connected');
                      return;
                    }

                    const userPublicKey = await freighterApi.getPublicKey();
                    console.log('Checking contract configuration...');
                    console.log('Public Key:', userPublicKey);

                    // Initialize Soroban service to log configuration
                    const sorobanService = new SorobanService(userPublicKey);

                    // Get network
                    const network = await freighterApi.getNetwork();
                    console.log('Current network:', network);

                    alert(
                      'Contract configuration checked. Check console for details.'
                    );
                  } catch (error: any) {
                    console.error('Debug check failed:', error);
                    alert(
                      `Debug check failed: ${error.message || 'Unknown error'}`
                    );
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Check Contract Configuration
              </button>
            </div>
          )}
        </form>
      )}

      {step === 'blockchain' && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">
            Creating bounty on the blockchain...
          </p>
          <p className="text-gray-400 mt-2">
            Please confirm the transaction in your wallet
          </p>
          <div className="mt-6 text-gray-400 text-sm max-w-md mx-auto">
            <p>
              Your wallet should be prompting you to confirm this transaction.
            </p>
            <p className="mt-2">
              If you don't see a wallet popup, please check your wallet
              extension.
            </p>
            <p className="mt-4">
              Confirm the transaction to create your bounty on the Stellar
              blockchain.
            </p>
          </div>
        </div>
      )}

      {step === 'database' && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Saving bounty details...</p>
          <p className="text-gray-400 mt-2">Bounty ID: {blockchainBountyId}</p>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-green-500 mx-auto flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-white text-xl font-semibold mt-4">
            Bounty Created!
          </h3>
          <p className="text-gray-400 mt-2">Bounty ID: {blockchainBountyId}</p>
          <button
            onClick={() =>
              (window.location.href = `/bounties/${blockchainBountyId}`)
            }
            className="mt-6 bg-white text-black font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors"
          >
            View Bounty
          </button>
        </div>
      )}
    </div>
  );
}
