import { Bounty, BountyStatus } from '@/types/bounty';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { SorobanService } from './soroban';

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
    }
  ) {
    try {
      if (!offChainData.extraRequirements) {
        offChainData.extraRequirements = '';
      }

      // Save to Firestore with the blockchain ID as the document ID
      await setDoc(doc(db, 'bounties', blockchainBountyId.toString()), {
        ...offChainData,
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
   * Get a complete bounty by combining blockchain and database data
   */
  async getBountyById(id: string | number): Promise<Bounty> {
    try {
      // Convert to number for blockchain call
      const numericId = typeof id === 'string' ? parseInt(id) : id;

      // Get on-chain data
      const onChainBounty = await this.sorobanService.getBounty(numericId);

      // Get off-chain data from Firestore
      const docRef = doc(db, 'bounties', id.toString());
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Bounty off-chain data not found');
      }

      const offChainData = docSnap.data();

      // Get creation date either from blockchain or database
      const createdDate = offChainData.createdAt || new Date().toISOString();

      // Combine the data
      const combinedBounty: Bounty = {
        id: numericId,
        owner: onChainBounty.owner,
        title: onChainBounty.title,
        description: offChainData.description,
        reward: {
          amount: onChainBounty.reward.toString(),
          asset: onChainBounty.token,
        },
        distribution: Array.from(onChainBounty.distribution).map(
          (dist: any) => ({
            percentage: dist[0],
            position: dist[1],
          })
        ),
        submissionDeadline: Number(onChainBounty.submission_deadline),
        judgingDeadline: Number(onChainBounty.judging_deadline),
        status: convertChainStatus(onChainBounty.status),
        category: offChainData.category,
        skills: offChainData.skills,
        created: createdDate,
        updatedAt: offChainData.updatedAt,
        deadline: new Date(
          Number(onChainBounty.submission_deadline)
        ).toISOString(),
      };

      return combinedBounty;
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

            return await this.getBountyById(bountyId);
          } catch (error) {
            console.error(`Error fetching bounty:`, error);
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
    submissionId: string
  ) {
    try {
      // Save to Firestore
      await setDoc(doc(db, 'submissions', submissionId), {
        bountyId: blockchainBountyId.toString(),
        applicantAddress,
        content,
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
   * Get all submissions for a bounty
   */
  async getBountySubmissions(bountyId: number | string) {
    try {
      // Convert to number for blockchain call
      const numericId =
        typeof bountyId === 'string' ? parseInt(bountyId) : bountyId;

      // Get on-chain submissions
      const onChainSubmissions = await this.sorobanService.getBountySubmissions(
        numericId
      );

      // Get off-chain submission data
      const submissionsRef = collection(db, 'submissions');
      const q = query(
        submissionsRef,
        where('bountyId', '==', bountyId.toString())
      );
      const snapshot = await getDocs(q);

      // Map the submissions
      const offChainSubmissions = snapshot.docs.reduce((acc, doc) => {
        acc[doc.data().applicantAddress] = doc.data();
        return acc;
      }, {} as Record<string, any>);

      // Combine the data
      return onChainSubmissions.map((submission) => {
        const offChainData = offChainSubmissions[submission.applicant] || {};

        return {
          id: submission.applicant, // Using applicant address as ID for now
          bountyId: numericId,
          applicant: submission.applicant,
          content: submission.submission,
          details: offChainData.content || '',
          created: offChainData.createdAt || new Date().toISOString(),
          status: 'PENDING', // Default status
          ranking: offChainData.ranking || null, // Add ranking property
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

        return {
          applicantAddress: winner.applicant,
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
      // This would store additional information about the winners
      const submissions = await this.getBountySubmissions(bountyId);

      // Match addresses to submissions and assign rankings
      winnerAddresses.forEach((address, index) => {
        const submission = submissions.find((s) => s.applicant === address);
        if (submission) {
          // Update the submission with the ranking in the database
          // This is a simplification - you would need to implement the actual database update
          console.log(
            `Updating submission ${submission.id} with ranking ${index + 1}`
          );
        }
      });
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
