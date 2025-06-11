import { SorobanService } from '@/lib/soroban';
import { Distribution } from '@/types/bounty';

/**
 * Utility functions for frontend blockchain operations
 */

/**
 * Create a bounty on the blockchain
 * @returns The blockchain bounty ID
 */
export async function createBountyOnChain({
  userPublicKey,
  title,
  token,
  reward,
  distribution,
  submissionDeadline,
  judgingDeadline,
}: {
  userPublicKey: string;
  title: string;
  token: string;
  reward: { amount: string; asset: string };
  distribution: Distribution[];
  submissionDeadline: number;
  judgingDeadline: number;
}): Promise<number> {
  try {
    // Initialize Soroban service with the user's public key
    const sorobanService = new SorobanService(userPublicKey);
    
    // Create bounty on the blockchain
    const bountyId = await sorobanService.createBounty({
      owner: userPublicKey,
      token,
      reward: { amount: reward.amount, asset: reward.asset },
      distribution,
      submissionDeadline,
      judgingDeadline,
      title,
    });
    
    return bountyId;
  } catch (error) {
    console.error('Error creating bounty on blockchain:', error);
    throw error;
  }
}

/**
 * Submit work to a bounty on the blockchain
 * @returns The submission ID
 */
export async function submitWorkOnChain({
  userPublicKey,
  bountyId,
  content,
}: {
  userPublicKey: string;
  bountyId: number;
  content: string;
}): Promise<string> {
  try {
    // Initialize Soroban service with the user's public key
    const sorobanService = new SorobanService(userPublicKey);
    
    // Submit work to the bounty
    await sorobanService.applyToBounty(userPublicKey, bountyId, content);
    
    // For now, we'll use a combination of user address and bounty ID as the submission ID
    // In a real implementation, the blockchain would return a unique ID
    const submissionId = `${userPublicKey}-${bountyId}`;
    
    return submissionId;
  } catch (error) {
    console.error('Error submitting work on blockchain:', error);
    throw error;
  }
}

/**
 * Update a bounty on the blockchain
 */
export async function updateBountyOnChain({
  userPublicKey,
  bountyId,
  title,
  distribution,
  submissionDeadline,
}: {
  userPublicKey: string;
  bountyId: number;
  title?: string;
  distribution?: Distribution[];
  submissionDeadline?: number;
}): Promise<void> {
  try {
    // Initialize Soroban service with the user's public key
    const sorobanService = new SorobanService(userPublicKey);
    
    // Convert distribution to the format expected by the smart contract
    const formattedDistribution = distribution ? 
      distribution.map(dist => [dist.position, dist.percentage] as const) : 
      [];
    
    // Update the bounty on the blockchain
    await sorobanService.updateBounty(bountyId, {
      title,
      distribution: formattedDistribution,
      submissionDeadline,
    });
  } catch (error) {
    console.error('Error updating bounty on blockchain:', error);
    throw error;
  }
}

/**
 * Delete a bounty on the blockchain
 */
export async function deleteBountyOnChain({
  userPublicKey,
  bountyId,
}: {
  userPublicKey: string;
  bountyId: number;
}): Promise<void> {
  try {
    // Initialize Soroban service with the user's public key
    const sorobanService = new SorobanService(userPublicKey);
    
    // Delete the bounty on the blockchain
    await sorobanService.deleteBounty(bountyId);
  } catch (error) {
    console.error('Error deleting bounty on blockchain:', error);
    throw error;
  }
} 