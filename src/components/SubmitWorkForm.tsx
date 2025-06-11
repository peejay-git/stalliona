import { useState } from 'react';
import { getPublicKey, isConnected } from '@stellar/freighter-api';
import { submitWorkOnChain } from '@/utils/blockchain';

interface SubmitWorkFormProps {
  bountyId: number;
}

export default function SubmitWorkForm({ bountyId }: SubmitWorkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'blockchain' | 'database' | 'complete'>('form');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    content: '',
    detailedDescription: '',
    links: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Step 1: Check if wallet is connected
      const connected = await isConnected();
      if (!connected) {
        throw new Error('Wallet not connected');
      }
      
      // Step 2: Get the user's public key
      const userPublicKey = await getPublicKey();
      
      // Step 3: Update UI state
      setStep('blockchain');
      
      // Step 4: Create a submission on the blockchain
      // We'll use the content as a short reference/hash that can go on-chain
      const blockchainSubmissionId = await submitWorkOnChain({
        userPublicKey,
        bountyId,
        content: formData.links, // Use links as the on-chain content (shorter)
      });
      
      // Step 5: Store submission ID
      setSubmissionId(blockchainSubmissionId);
      
      // Step 6: Update UI state
      setStep('database');
      
      // Step 7: Save detailed submission data to the database
      const response = await fetch(`/api/bounties/${bountyId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockchainSubmissionId,
          applicantAddress: userPublicKey,
          content: formData.detailedDescription, // Store detailed content in the database
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save submission data');
      }
      
      // Step 8: Complete
      setStep('complete');
    } catch (error) {
      console.error('Error submitting work:', error);
      alert('Failed to submit work: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white/10 backdrop-blur-xl rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Submit Work for Bounty #{bountyId}</h2>
      
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Links */}
          <div>
            <label className="block text-white mb-2">Link to Work</label>
            <input
              type="text"
              name="links"
              value={formData.links}
              onChange={handleChange}
              placeholder="GitHub repository URL, deployed app URL, etc."
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
              required
            />
            <p className="text-gray-400 text-xs mt-1">This will be stored on the blockchain - keep it concise.</p>
          </div>
          
          {/* Detailed Description */}
          <div>
            <label className="block text-white mb-2">Detailed Description</label>
            <textarea
              name="detailedDescription"
              value={formData.detailedDescription}
              onChange={handleChange}
              placeholder="Describe your submission in detail. Include any relevant information that would help the bounty owner evaluate your work."
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white h-32"
              required
            />
            <p className="text-gray-400 text-xs mt-1">This will be stored in the database, not on the blockchain.</p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-white/90 transition-colors"
          >
            {isLoading ? 'Submitting Work...' : 'Submit Work'}
          </button>
        </form>
      )}
      
      {step === 'blockchain' && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Submitting work to the blockchain...</p>
          <p className="text-gray-400 mt-2">Please confirm the transaction in your wallet</p>
        </div>
      )}
      
      {step === 'database' && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Saving submission details...</p>
          <p className="text-gray-400 mt-2">Submission ID: {submissionId}</p>
        </div>
      )}
      
      {step === 'complete' && (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-green-500 mx-auto flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-semibold mt-4">Work Submitted!</h3>
          <p className="text-gray-400 mt-2">Your submission has been recorded on the blockchain and saved in our database.</p>
          <button
            onClick={() => window.location.href = `/bounties/${bountyId}`}
            className="mt-6 bg-white text-black font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors"
          >
            View Bounty
          </button>
        </div>
      )}
    </div>
  );
} 