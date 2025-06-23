import { Bounty, BountyStatus } from '@/types/bounty';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { SorobanService } from './soroban';
import { BlockchainError } from '@/utils/error-handler';

// For now we're using Firestore instead of Prisma since that seems to be what's currently set up
// This service handles the coordination between blockchain and database

// Helper to convert chain status to app status
function convertChainStatus(status: any): BountyStatus {
  // Check if the status is an object with a tag property
  if (status && typeof status === 'object' && 'tag' in status) {
    // Map the chain status tag to our BountyStatus enum
    switch (status.tag) {
      case 'Open':
        return BountyStatus.OPEN;
      case 'InProgress':
        return BountyStatus.IN_PROGRESS;
      case 'Review':
        return BountyStatus.REVIEW;
      case 'Completed':
        return BountyStatus.COMPLETED;
      case 'Cancelled':
        return BountyStatus.CANCELLED;
      default:
        return BountyStatus.OPEN;
    }
  }

  // Fallback to string status if not an object
  return status as BountyStatus;
}

/**
 * BountyService class that coordinates blockchain and database operations
 */
export class BountyService {
  private sorobanService: SorobanService;

  constructor(publicKey?: string) {
    // Initialize with user's public key if available
    this.sorobanService = new SorobanService(publicKey || '');
  }

  /**
   * Create a bounty in the database using the blockchain ID
   * This should be called after the bounty is created on the blockchain
   */
  async saveBountyToDatabase(
    blockchainBountyId: number,
    offChainData: {
      description: string;
      category: string;
      skills: string[];
      extraRequirements?: string;
      owner?: string;
      title?: string;
      reward?: { amount: string; asset: string };
      deadline?: string;
      submissionDeadline?: number;
      judgingDeadline?: number;
      status?: string;
    }
  ) {
    try {
      if (!offChainData.extraRequirements) {
        offChainData.extraRequirements = '';
      }

      // Get on-chain data to include title and other essential fields
      let onChainData: {
        title?: string;
        owner?: string;
        reward?: { amount: string; asset: string };
        submissionDeadline?: number;
        judgingDeadline?: number;
        status?: string;
        deadline?: string;
      } = {};
      try {
        const bounty = await this.sorobanService.getBounty(blockchainBountyId);
        onChainData = {
          title: bounty.title,
          owner: bounty.owner,
          reward: {
            amount: bounty.reward.toString(),
            asset: bounty.token
          },
          submissionDeadline: Number(bounty.submission_deadline),
          judgingDeadline: Number(bounty.judging_deadline),
          status: convertChainStatus(bounty.status),
          deadline: new Date(Number(bounty.submission_deadline)).toISOString(),
        };
      } catch (error) {
        console.error('Failed to fetch on-chain data, using placeholder data:', error);
        // Use placeholder data if we can't fetch from blockchain
        onChainData = {
          title: 'Untitled Bounty',
          owner: '',
          reward: { amount: '0', asset: 'USDC' },
          submissionDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week from now
          judgingDeadline: Date.now() + 14 * 24 * 60 * 60 * 1000, // 2 weeks from now
          status: 'OPEN',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      // Save to Firestore with the blockchain ID as the document ID
      await setDoc(doc(db, 'bounties', blockchainBountyId.toString()), {
        ...offChainData,
        ...onChainData,
        // Explicitly store all required fields in the database
        // Prioritize data from the request over blockchain data
        owner: offChainData.owner || onChainData.owner || '',
        title: offChainData.title || onChainData.title || 'Untitled Bounty',
        reward: offChainData.reward || onChainData.reward || { amount: '0', asset: 'USDC' },
        submissionDeadline: onChainData.submissionDeadline || Date.now() + 7 * 24 * 60 * 60 * 1000,
        judgingDeadline: onChainData.judgingDeadline || Date.now() + 14 * 24 * 60 * 60 * 1000,
        status: onChainData.status || BountyStatus.OPEN,
        deadline: offChainData.deadline || onChainData.deadline || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return blockchainBountyId;
    } catch (error) {
      console.error('Error saving bounty to database:', error);
      throw new Error('Failed to save bounty to database');
    }
  }

  /**
   * Get bounty details
   */
  async getBountyById(id: string | number): Promise<Bounty> {
    try {
      // Convert to number for blockchain call
      const numericId = typeof id === 'string' ? parseInt(id) : id;
      console.log(`Fetching bounty with ID: ${numericId}`);

      // Get on-chain data
      try {
      const onChainBounty = await this.sorobanService.getBounty(numericId);
        console.log(`Successfully fetched on-chain bounty data: ${JSON.stringify(onChainBounty, null, 2)}`);

      // Get off-chain data from Firestore
      const docRef = doc(db, 'bounties', id.toString());
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Bounty off-chain data not found');
      }

      const offChainData = docSnap.data();
        console.log(`Successfully fetched off-chain bounty data: ${JSON.stringify(offChainData, null, 2)}`);

      // Get creation date either from blockchain or database
      const createdDate = offChainData.createdAt || new Date().toISOString();

        // Get status from either source, prioritizing blockchain
        const status = convertChainStatus(onChainBounty.status) || offChainData.status || BountyStatus.OPEN;

      // Combine the data
      const combinedBounty: Bounty = {
        id: numericId,
          // Prioritize blockchain data for critical fields
          owner: onChainBounty.owner || offChainData.owner || '',
          title: onChainBounty.title || offChainData.title || '',
          description: offChainData.description || '',
        reward: {
            amount: onChainBounty.reward?.toString() || offChainData.reward?.amount || '0',
            asset: onChainBounty.token || offChainData.reward?.asset || 'USDC',
        },
          distribution: Array.from(onChainBounty.distribution || []).map(
          (dist: any) => ({
            percentage: dist[0],
            position: dist[1],
          })
        ),
          // Prioritize blockchain data for deadlines but fall back to database
          submissionDeadline: Number(onChainBounty.submission_deadline) || offChainData.submissionDeadline || 0,
          judgingDeadline: Number(onChainBounty.judging_deadline) || offChainData.judgingDeadline || 0,
          status: status,
          category: offChainData.category || '',
          skills: offChainData.skills || [],
        created: createdDate,
          updatedAt: offChainData.updatedAt || createdDate,
        deadline: new Date(
            Number(onChainBounty.submission_deadline) || offChainData.submissionDeadline || Date.now()
        ).toISOString(),
      };

      return combinedBounty;
      } catch (error) {
        console.error(`Error fetching on-chain data for bounty ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Error fetching complete bounty ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all bounties with combined data
   */
  async getAllBounties(filters?: any): Promise<Bounty[]> {
    try {
      // Get all bounty IDs from blockchain
      const onChainBounties = await this.sorobanService.getBounties();

      // Map over each bounty ID and get the complete data
      const bounties = await Promise.all(
        onChainBounties.map(async (bounty: any) => {
          try {
            // Make sure bounty has an id property
            const bountyId =
              bounty.id !== undefined
                ? Number(bounty.id)
                : bounty.bounty_id !== undefined
                ? Number(bounty.bounty_id)
                : 0;

            if (bountyId === 0) {
              console.error('Bounty is missing ID property:', bounty);
              return null;
            }

            // Get full bounty details with both on-chain and off-chain data
            return await this.getBountyById(bountyId);
          } catch (error) {
            console.error(`Error fetching bounty:`, error);
            
            // If we can't get the full details, try to return partial data
            try {
              // Try to get off-chain data at minimum
              const docRef = doc(db, 'bounties', bounty.id.toString());
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                const offChainData = docSnap.data();
                
                // Return partial bounty with at least the off-chain data
                return {
                  id: Number(bounty.id),
                  owner: offChainData.owner || '',
                  title: offChainData.title || 'Untitled Bounty',
                  description: offChainData.description || '',
                  reward: offChainData.reward || { amount: '0', asset: 'USDC' },
                  distribution: [],
                  submissionDeadline: offChainData.submissionDeadline || 0,
                  judgingDeadline: offChainData.judgingDeadline || 0,
                  status: offChainData.status || BountyStatus.OPEN,
                  category: offChainData.category || '',
                  skills: offChainData.skills || [],
                  created: offChainData.createdAt || new Date().toISOString(),
                  updatedAt: offChainData.updatedAt || new Date().toISOString(),
                  deadline: offChainData.deadline || new Date().toISOString(),
                } as Bounty;
              }
            } catch (dbError) {
              console.error(`Failed to get off-chain data for bounty ${bounty.id}:`, dbError);
            }
            
            return null;
          }
        })
      );

      // Filter out any nulls (failed fetches)
      return bounties.filter((bounty): bounty is Bounty => bounty !== null);
    } catch (error) {
      console.error('Error fetching all bounties:', error);
      throw error;
    }
  }

  /**
   * Submit work for a bounty - this should be called after blockchain submission
   */
  async saveSubmissionToDatabase(
    blockchainBountyId: number,
    applicantAddress: string,
    content: string,
    submissionId: string,
    links?: string,
    userId?: string | null
  ) {
    try {
      // Save to Firestore
      await setDoc(doc(db, 'submissions', submissionId), {
        bountyId: blockchainBountyId.toString(),
        applicantAddress,
        userId: userId || null,
        content,
        links: links || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return submissionId;
    } catch (error) {
      console.error('Error saving submission to database:', error);
      throw new Error('Failed to save submission to database');
    }
  }

  /**
   * Get all submissions for a bounty (database-only approach)
   */
  async getBountySubmissions(bountyId: number | string) {
    try {
      // Convert to number for consistency
      const numericId =
        typeof bountyId === 'string' ? parseInt(bountyId) : bountyId;

      // Get off-chain submission data from the database
      const submissionsRef = collection(db, 'submissions');
      const q = query(
        submissionsRef,
        where('bountyId', '==', bountyId.toString())
      );
      const snapshot = await getDocs(q);

      // If there are no submissions in the database, return empty array
      if (snapshot.empty) {
        return [];
      }

      // Map the submissions from the database
      return snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Submission data for ${doc.id}:`, data);
        return {
          id: doc.id,
          bountyId: numericId,
          applicant: data.applicantAddress, // This is the talent's wallet address
          userId: data.userId || null, // Include the userId field
          submission: data.links || '',
          content: data.content || '',
          details: data.content || '',
          links: data.links || '',
          created: data.createdAt || new Date().toISOString(),
          status: data.status || 'PENDING',
          ranking: data.ranking || null,
        };
      });
    } catch (error) {
      console.error(
        `Error fetching submissions for bounty ${bountyId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get winners for a bounty
   */
  async getBountyWinners(bountyId: number | string): Promise<
    {
      applicantAddress: string;
      userId: string | null;
      position: number;
      percentage: number;
      content: string;
      rewardAmount: string;
      rewardAsset: string;
    }[]
  > {
    try {
      // Convert to number for blockchain call
      const numericId =
        typeof bountyId === 'string' ? parseInt(bountyId) : bountyId;

      // Get the bounty details first
      const bounty = await this.getBountyById(numericId);

      // If the bounty is not completed, it doesn't have winners yet
      if (bounty.status !== 'COMPLETED') {
        return [];
      }

      // Get on-chain winners (this would need to be implemented in the smart contract)
      // For now, we'll simulate it with submissions that have rankings
      const submissions = await this.getBountySubmissions(numericId);

      // Get the winning submissions sorted by ranking
      const winningSubmissions = submissions
        .filter((submission) => submission.ranking !== null)
        .sort((a, b) => (a.ranking || 0) - (b.ranking || 0));

      // Match the winners with the distribution percentages
      return bounty.distribution.map((dist, index) => {
        const winner = winningSubmissions[index] || null;

        // If there's no winner for this position, return placeholder data
        if (!winner) {
          return {
            applicantAddress: 'No winner selected',
            userId: null,
            position: dist.position,
            percentage: dist.percentage,
            content: '',
            rewardAmount: this.calculateRewardAmount(
              bounty.reward.amount,
              dist.percentage
            ),
            rewardAsset: bounty.reward.asset,
          };
        }

        // Use the applicant address for payment
        const paymentAddress = winner.applicant;

        return {
          applicantAddress: paymentAddress, // Use the wallet address for payment
          userId: winner.userId,
          position: dist.position,
          percentage: dist.percentage,
          content: winner.content,
          rewardAmount: this.calculateRewardAmount(
            bounty.reward.amount,
            dist.percentage
          ),
          rewardAsset: bounty.reward.asset,
        };
      });
    } catch (error) {
      console.error(`Error fetching winners for bounty ${bountyId}:`, error);
      throw error;
    }
  }

  /**
   * Select winners for a bounty
   */
  async selectBountyWinners(
    bountyId: number,
    winnerAddresses: string[],
    userPublicKey: string
  ): Promise<void> {
    try {
      // Get the bounty first to validate ownership
      const bounty = await this.getBountyById(bountyId);

      // Verify the caller is the owner
      if (bounty.owner !== userPublicKey) {
        throw new Error('Only the bounty owner can select winners');
      }

      // Make sure we have the right number of winners
      if (winnerAddresses.length !== bounty.distribution.length) {
        throw new Error(
          `You must select exactly ${bounty.distribution.length} winners`
        );
      }

      // Call the blockchain to select winners
      // This would call the smart contract's function to select winners
      await this.sorobanService.selectWinners(
        bountyId,
        userPublicKey,
        winnerAddresses
      );

      // Update the database with the winner selections
      const submissions = await this.getBountySubmissions(bountyId);

      // Match addresses to submissions and assign rankings
      const updates = winnerAddresses.map(async (address, index) => {
        // Find submission by applicant address
        const submission = submissions.find(
          (s) => s.applicant === address
        );
        
        if (submission) {
          // Update the submission with the ranking in the database
          const submissionRef = doc(db, 'submissions', submission.id);
          await updateDoc(submissionRef, {
            ranking: index + 1,
            status: 'ACCEPTED',
            updatedAt: new Date().toISOString()
          });
          console.log(`Updated submission ${submission.id} with ranking ${index + 1}`);
        } else {
          console.warn(`Could not find submission for address ${address}`);
        }
      });

      // Wait for all updates to complete
      await Promise.all(updates);

      // Update bounty status to COMPLETED
      const bountyRef = doc(db, 'bounties', bountyId.toString());
      await updateDoc(bountyRef, {
        status: 'COMPLETED',
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Updated bounty ${bountyId} status to COMPLETED`);
    } catch (error) {
      console.error(`Error selecting winners for bounty ${bountyId}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to calculate reward amount based on percentage
   */
  private calculateRewardAmount(
    totalAmount: string,
    percentage: number
  ): string {
    const total = parseFloat(totalAmount);
    return ((total * percentage) / 100).toFixed(2);
  }
}
