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
 * BountyService class that handles database operations
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
      owner: string;
      title: string;
      reward: string | { amount: string; asset: string };
      deadline: string;
      submissionDeadline: string;
      judgingDeadline: string;
      status: string;
      updatedAt?: string;
    },
  ) {
    try {
      if (!offChainData.extraRequirements) {
        offChainData.extraRequirements = '';
      }

      if (!offChainData.updatedAt) {
        offChainData.updatedAt = new Date().toISOString();
      }

      // Parse reward if it's a string
      let reward = offChainData.reward;
      if (typeof reward === 'string') {
        try {
          reward = JSON.parse(reward);
        } catch (e) {
          console.warn('Failed to parse reward string:', e);
          reward = { amount: '0', asset: 'USDC' };
        }
      }

      // Save to Firestore with the blockchain ID as the document ID
      await setDoc(doc(db, 'bounties', blockchainBountyId.toString()), {
        ...offChainData,
        reward,
        createdAt: new Date().toISOString(),
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
      // Convert to number for consistency
      const numericId = typeof id === 'string' ? parseInt(id) : id;

      // Get on-chain data
      const onChainBounty = await this.sorobanService.getBounty(numericId);

      // Get off-chain data from Firestore
      const docRef = doc(db, 'bounties', id.toString());
      const docSnap = await getDoc(docRef);

      // Even if not in DB, we might want to return on-chain data?
      // But typically we need description etc.
      // If not in DB, maybe return partial?
      // For now conforming to Upstream logic which expects doc to exist.

      const offChainData = docSnap.exists() ? docSnap.data() : {};

      // Get creation date either from blockchain or database
      const createdDate = offChainData.createdAt || new Date().toISOString();

      // Combine the data
      const combinedBounty: Bounty = {
        id: numericId,
        owner: onChainBounty.owner,
        title: onChainBounty.title,
        description: offChainData.description || '',
        reward: {
          amount: onChainBounty.reward.toString(),
          asset: onChainBounty.token,
        },
        distribution: Array.from(onChainBounty.distribution).map(
          (dist: any) => ({
            percentage: dist[0],
            position: dist[1],
          }),
        ),
        submissionDeadline: Number(onChainBounty.submission_deadline),
        judgingDeadline: Number(onChainBounty.judging_deadline),
        status: convertChainStatus(onChainBounty.status),
        category: offChainData.category || '',
        skills: offChainData.skills || [],
        created: createdDate,
        updatedAt: offChainData.updatedAt || createdDate,
        deadline: new Date(
          Number(onChainBounty.submission_deadline),
        ).toISOString(),
      };

      return combinedBounty;
    } catch (error) {
      console.error(`Error fetching bounty ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all bounties
   */
  async getAllBounties(filters?: any): Promise<Bounty[]> {
    try {
      // Fetch all bounties from blockchain to ensure we have the complete list of IDs
      let onChainBounties: any[] = [];
      try {
        onChainBounties = await this.sorobanService.getBounties();
      } catch (e) {
        console.warn('Failed to fetch bounties from blockchain', e);
        // Fallback or empty if critical?
        // If blockchain fails, we might still want to show DB bounties?
      }

      const bountiesRef = collection(db, 'bounties');
      const snapshot = await getDocs(bountiesRef);

      if (onChainBounties.length > 0) {
        // Map over each blockchain bounty and merge with DB data
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
                return null;
              }

              // Retrieve off-chain data from snapshot if available to avoid N reads?
              // Optimization: Find doc in snapshot.
              const docSnap = snapshot.docs.find(
                (d) => d.id === bountyId.toString(),
              );

              if (docSnap) {
                const offChainData = docSnap.data();
                const createdDate =
                  offChainData.createdAt || new Date().toISOString();

                return {
                  id: bountyId,
                  owner: bounty.owner,
                  title: bounty.title,
                  description: offChainData.description || '',
                  reward: {
                    amount: bounty.reward.toString(),
                    asset: bounty.token,
                  },
                  distribution: Array.from(bounty.distribution).map(
                    (dist: any) => ({
                      percentage: dist[0],
                      position: dist[1],
                    }),
                  ),
                  submissionDeadline: Number(bounty.submission_deadline),
                  judgingDeadline: Number(bounty.judging_deadline),
                  status: convertChainStatus(bounty.status),
                  category: offChainData.category || '',
                  skills: offChainData.skills || [],
                  created: createdDate,
                  updatedAt: offChainData.updatedAt || createdDate,
                  deadline: new Date(
                    Number(bounty.submission_deadline),
                  ).toISOString(),
                } as Bounty;
              } else {
                // Fetch individual via getBountyById which fetches chain (redundant) + DB
                // Or just return basic chain data?
                return await this.getBountyById(bountyId);
              }
            } catch (error) {
              console.error(`Error fetching bounty:`, error);
              return null;
            }
          }),
        );
        return bounties.filter((bounty): bounty is Bounty => bounty !== null);
      } else {
        // Fallback to Firestore only if blockchain fetch failed or empty?
        if (snapshot.empty) return [];

        return snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: Number(doc.id),
            owner: data.owner || '',
            title: data.title || '',
            description: data.description || '',
            reward: data.reward || { amount: '0', asset: 'USDC' },
            distribution: data.distribution || [],
            submissionDeadline: data.submissionDeadline || 0,
            judgingDeadline: data.judgingDeadline || 0,
            status: data.status || BountyStatus.OPEN,
            category: data.category || '',
            skills: data.skills || [],
            created: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            deadline: data.deadline || new Date().toISOString(),
          } as Bounty;
        });
      }
    } catch (error) {
      console.error('Error fetching all bounties:', error);
      throw error;
    }
  }

  /**
   * Save submission to database
   */
  async saveSubmissionToDatabase(
    bountyId: number,
    applicantAddress: string,
    content: string,
    submissionId: string,
    links?: string,
    userId?: string,
  ) {
    try {
      // Save to Firestore
      await setDoc(doc(db, 'submissions', submissionId), {
        bountyId: bountyId.toString(),
        applicantAddress,
        content,
        // Ensure content is also stored as details/links if needed
        links: links || '',
        userId: userId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'PENDING',
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
      const onChainSubmissions =
        await this.sorobanService.getBountySubmissions(numericId);

      // Get off-chain submission data
      const submissionsRef = collection(db, 'submissions');
      const q = query(
        submissionsRef,
        where('bountyId', '==', bountyId.toString()),
      );
      const snapshot = await getDocs(q);

      // Map the submissions
      const offChainSubmissions = snapshot.docs.reduce(
        (acc, doc) => {
          // We match by applicant address
          acc[doc.data().applicantAddress] = doc.data();
          return acc;
        },
        {} as Record<string, any>,
      );

      // Combine the data
      return onChainSubmissions.map((submission) => {
        const offChainData = offChainSubmissions[submission.applicant] || {};

        return {
          id: submission.applicant, // Using applicant address as ID
          bountyId: numericId,
          applicant: submission.applicant,
          walletAddress: submission.applicant,
          content: submission.submission, // On-chain content (likely link)
          details: offChainData.content || '', // Off-chain content
          created: offChainData.createdAt || new Date().toISOString(),
          status: offChainData.status || 'PENDING',
          ranking: offChainData.ranking || null,
          userId: offChainData.userId || null,
          links: offChainData.links || '',
        };
      });
    } catch (error) {
      console.error(
        `Error fetching submissions for bounty ${bountyId}:`,
        error,
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
      if (bounty.status !== BountyStatus.COMPLETED) {
        return [];
      }

      // Get submissions to find rankings
      const submissions = await this.getBountySubmissions(numericId);

      // Get the winning submissions sorted by ranking
      const winningSubmissions = submissions
        .filter((submission) => submission.ranking !== null)
        .sort((a, b) => (a.ranking || 0) - (b.ranking || 0));

      // Match the winners with the distribution percentages
      return bounty.distribution.map((dist, index) => {
        // Wait, distribution is position/percentage. rank 1 matches dist.position == 1?
        // Usually distribution is ordered by position (1, 2, 3...)
        // Let's find the winner for this position

        // Assuming distribution list might not be sorted by position
        // But usually it is.
        // Let's assume dist.position corresponds to ranking value.

        const winner = winningSubmissions.find(
          (s) => s.ranking === dist.position,
        );

        if (!winner) {
          return {
            applicantAddress: 'No winner selected',
            position: dist.position,
            percentage: dist.percentage,
            content: '',
            rewardAmount: this.calculateRewardAmount(
              bounty.reward.amount,
              dist.percentage,
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
            dist.percentage,
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
    userPublicKey: string,
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
          `You must select exactly ${bounty.distribution.length} winners`,
        );
      }

      // Call the blockchain to select winners
      await this.sorobanService.selectWinners(
        bountyId,
        userPublicKey,
        winnerAddresses,
      );

      // Update the database with the winner selections (rankings)
      // This part was manual in the Upstream code (logging only).
      // We should ideally update the Firestore docs here.

      const submissions = await this.getBountySubmissions(bountyId);

      // Update each winner's submission in FireStore
      // Note: getBountySubmissions returns combined data. We need to look up submissionIds (applicantAddress usually used as ID in submissions collection?)
      // In saveSubmissionToDatabase, we used a generated ID.
      // But getBountySubmissions keyed by applicantAddress.
      // We need to find the Firestore doc ID for each applicant.

      const submissionsRef = collection(db, 'submissions');
      const q = query(
        submissionsRef,
        where('bountyId', '==', bountyId.toString()),
      );
      const snapshot = await getDocs(q);

      // Map address to docId
      const addressToDocId: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.applicantAddress) {
          addressToDocId[data.applicantAddress] = doc.id;
        }
      });

      const updatePromises = winnerAddresses.map(async (address, index) => {
        const ranking = index + 1; // 1-based ranking
        const docId = addressToDocId[address];
        if (docId) {
          console.log(
            `Updating submission ${docId} (Address: ${address}) with ranking ${ranking}`,
          );
          await setDoc(
            doc(db, 'submissions', docId),
            { ranking },
            { merge: true },
          );
        } else {
          console.warn(
            `Could not find Firestore submission for winner ${address}`,
          );
        }
      });

      await Promise.all(updatePromises);

      // Also update bounty status to COMPLETED in Firestore if needed?
      // convertChainStatus handles it from chain, but for faster local checks:
      await setDoc(
        doc(db, 'bounties', bountyId.toString()),
        { status: 'COMPLETED' },
        { merge: true },
      );
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
    percentage: number,
  ): string {
    const total = parseFloat(totalAmount);
    return ((total * percentage) / 100).toFixed(2);
  }
}
