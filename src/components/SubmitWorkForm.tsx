import { useState, useEffect } from 'react';
import freighterApi from '@stellar/freighter-api';
import { submitWorkOnChain } from '@/utils/blockchain';
import toast from 'react-hot-toast';
import { useWallet } from '@/hooks/useWallet';
import { useUserStore } from '@/lib/stores/useUserStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { connectWallet } from '@/lib/authService';

interface SubmitWorkFormProps {
  bountyId: number;
}

export default function SubmitWorkForm({ bountyId }: SubmitWorkFormProps) {
  const [formData, setFormData] = useState({
    detailedDescription: '',
    links: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'submitting' | 'complete'>('form');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [userWalletAddress, setUserWalletAddress] = useState<string | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [checkingPreviousSubmission, setCheckingPreviousSubmission] = useState(true);
  
  const user = useUserStore((state) => state.user);
  const { publicKey, isConnected } = useWallet();
  
  // Check if user has already submitted to this bounty
  useEffect(() => {
    const checkPreviousSubmission = async () => {
      setCheckingPreviousSubmission(true);
      
      try {
        if (!user?.uid) {
          setHasSubmitted(false);
          return;
        }
        
        // Query submissions collection to check if user already submitted
        const submissionsRef = collection(db, 'submissions');
        const q = query(
          submissionsRef,
          where('bountyId', '==', bountyId.toString()),
          where('userId', '==', user.uid)
        );
        
        const snapshot = await getDocs(q);
        
        // If there are submissions by this user for this bounty, set hasSubmitted to true
        setHasSubmitted(!snapshot.empty);
        
        if (!snapshot.empty) {
          console.log('User has already submitted to this bounty');
        }
      } catch (err) {
        console.error('Error checking previous submissions:', err);
        setHasSubmitted(false);
      } finally {
        setCheckingPreviousSubmission(false);
      }
    };
    
    checkPreviousSubmission();
  }, [user?.uid, bountyId]);
  
  // Get the user's wallet address from their profile when component loads
  useEffect(() => {
    const fetchUserWallet = async () => {
      setLoadingWallet(true);
      
      try {
        if (!user?.uid) {
          setUserWalletAddress(null);
          return;
        }
        
        // First check if user has a wallet in their profile
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().wallet?.publicKey) {
          // Use wallet from profile
          setUserWalletAddress(userDoc.data().wallet.publicKey);
          return;
        }
        
        // If no wallet in profile but one is connected in session, use that
        if (isConnected && publicKey) {
          setUserWalletAddress(publicKey);
          
          // Also save this wallet to the user's profile for future use
          if (user.uid) {
            await connectWallet({
              address: publicKey,
              publicKey: publicKey,
              network: 'TESTNET', // This should be dynamic based on environment
            });
          }
          return;
        }
        
        // No wallet available
        setUserWalletAddress(null);
      } catch (err) {
        console.error('Error fetching user wallet:', err);
        setUserWalletAddress(null);
      } finally {
        setLoadingWallet(false);
      }
    };
    
    fetchUserWallet();
  }, [user, isConnected, publicKey]);
  
  // Function to validate the form
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.detailedDescription.trim()) {
      newErrors.detailedDescription = 'Detailed description is required';
    }
    
    if (!formData.links.trim()) {
      newErrors.links = 'At least one link is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Function to handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  // Function to submit work on-chain (simulated)
  const submitWorkOnChain = async ({
    userPublicKey,
    bountyId,
    content,
  }: {
    userPublicKey: string;
    bountyId: string | number;
    content: string;
  }) => {
    // In a real implementation, this would call the blockchain
    // For now, we'll just generate a random ID
    return `submission_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validate()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Validate user is logged in
      if (!user || !user.uid) {
        throw new Error('You must be logged in to submit work');
      }
      
      // Make sure we have a wallet address
      if (!userWalletAddress) {
        throw new Error('No wallet address found. Please connect your wallet in your profile settings.');
      }
      
      // Double-check that user hasn't already submitted to this bounty
      const submissionsRef = collection(db, 'submissions');
      const q = query(
        submissionsRef,
        where('bountyId', '==', bountyId.toString()),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        throw new Error('You have already submitted work for this bounty');
      }
      
      // Update UI state
      setStep('submitting');
      toast.loading('Submitting your work...', { id: 'submit-work' });
      
      // Generate a submission ID (no blockchain transaction)
      const blockchainSubmissionId = await submitWorkOnChain({
        userPublicKey: userWalletAddress,
        bountyId,
        content: formData.links, // Use links as the on-chain content (shorter)
      });
      
      // Store submission ID
      setSubmissionId(blockchainSubmissionId);
      
      // Save detailed submission data to the database
      const response = await fetch(`/api/bounties/${bountyId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockchainSubmissionId,
          applicantAddress: userWalletAddress,
          userId: user?.uid || null,
          content: formData.detailedDescription, // Store detailed content in the database
          links: formData.links,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save submission data');
      }
      
      // Complete
      setStep('complete');
      toast.success('Work submitted successfully!', { id: 'submit-work' });
    } catch (error: any) {
      console.error('Error submitting work:', error);
      toast.error(error.message || 'Failed to submit work', { id: 'submit-work' });
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loadingWallet || checkingPreviousSubmission) {
    return (
      <div className="text-center py-10 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="text-white mt-4">Loading submission information...</p>
      </div>
    );
  }
  
  if (hasSubmitted) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Submit Work</h2>
        <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-200 font-medium mb-2">
            You have already submitted work for this bounty
          </p>
          <p className="text-yellow-200 text-sm">
            You can only submit once per bounty. If you need to make changes, please contact the bounty sponsor.
          </p>
        </div>
      </div>
    );
  }
  
  if (!userWalletAddress) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Submit Work</h2>
        <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-200">
            You need to connect a wallet to your account before submitting work.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/connect-wallet'}
          className="bg-white text-black font-medium py-2 px-4 rounded-lg hover:bg-white/90 transition-colors"
        >
          Connect Wallet in Profile
        </button>
      </div>
    );
  }
  
  if (step === 'form') {
    return (
      <>
        <h2 className="text-2xl font-bold text-white p-6 pb-0 mb-4">Submit Work</h2>
        
        <div className="mx-6 mb-4 bg-blue-900/30 border border-blue-700/30 rounded-lg p-3">
          <p className="text-blue-200 text-sm">
            Your submission will be linked to your wallet address: {userWalletAddress.slice(0, 8)}...{userWalletAddress.slice(-6)}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-0">
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
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-white/90 transition-colors"
          >
            {isLoading ? 'Submitting Work...' : 'Submit Work'}
          </button>
        </form>
      </>
    );
  }
  
  if (step === 'submitting') {
    return (
      <div className="text-center py-10 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="text-white mt-4">Submitting your work...</p>
        <p className="text-gray-400 mt-2">Please wait while we save your submission</p>
      </div>
    );
  }
  
  if (step === 'complete') {
    return (
      <div className="text-center py-10 p-6">
        <div className="w-12 h-12 rounded-full bg-green-500 mx-auto flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-white text-xl font-semibold mt-4">Work Submitted!</h3>
        <p className="text-gray-400 mt-2">Your submission has been recorded successfully.</p>
        <button
          onClick={() => window.location.href = `/bounties/${bountyId}`}
          className="mt-6 bg-white text-black font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors"
        >
          View Bounty
        </button>
      </div>
    );
  }
} 