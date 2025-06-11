import { Distribution } from '@/types/bounty';
import { BlockchainError } from '@/utils/error-handler';
import { getPublicKey, isConnected } from '@stellar/freighter-api';
import {
  Status as BountyStatus,
  Bounty as ContractBounty,
  Client as SorobanClient,
} from '../../packages/stallion/src/index';

// Environment variables with defaults
const CONTRACT_ID = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID || '';
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || '';
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || '';

if (!CONTRACT_ID || !NETWORK || !SOROBAN_RPC_URL) {
  throw new Error('Missing required environment variables for Soroban');
}

/**
 * Soroban service for interacting with the bounty contract
 */
export class SorobanService {
  private contractId: string;
  private network: string;
  private sorobanClient: SorobanClient;
  private publicKey: string | null;

  constructor(publicKey?: string) {
    this.contractId = CONTRACT_ID;
    this.network = NETWORK;
    this.publicKey = publicKey || null;

    try {
      // Initialize the Soroban client for contract interactions
      this.sorobanClient = new SorobanClient({
        contractId: this.contractId,
        networkPassphrase: this.network,
        rpcUrl: SOROBAN_RPC_URL,
        publicKey: this.publicKey || '',
      });

      // Initialize wallet connection if no public key provided
      if (!this.publicKey) {
        isConnected().then((connected) => {
          if (connected) {
            getPublicKey().then((publicKey) => {
              this.publicKey = publicKey;
            });
          }
        });
      }

      console.log(
        `Initialized Soroban service with contract: ${this.contractId} on network: ${this.network}`
      );
    } catch (error) {
      console.error('Error initializing Soroban client:', error);
      throw new BlockchainError(
        'Failed to initialize Soroban client',
        'CONNECTION_ERROR'
      );
    }
  }

  /**
   * Get a specific submission for a bounty
   */
  async getSubmission(bountyId: number, user: string): Promise<string> {
    try {
      const tx = await this.sorobanClient.get_submission({
        bounty_id: bountyId,
        user,
      });

      const result = await tx.simulate();
      const sentTx = await result.signAndSend();

      // await confirmation
      if (sentTx.result.isOk()) {
        return sentTx.result.unwrap();
      }

      throw new BlockchainError('Failed to get submission', 'CONTRACT_ERROR');
    } catch (error) {
      console.error('Error getting submission:', error);
      throw new BlockchainError('Failed to get submission', 'CONTRACT_ERROR');
    }
  }

  /**
   * Create a new bounty
   */
  async createBounty({
    title,
    owner,
    token,
    reward,
    distribution,
    submissionDeadline,
    judgingDeadline,
  }: {
    title: string;
    owner: string;
    token: string;
    reward: { amount: string; asset: string };
    distribution: Distribution[];
    submissionDeadline: number;
    judgingDeadline: number;
  }): Promise<number> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      const tx = await this.sorobanClient.create_bounty({
        owner: owner,
        token: token,
        reward: BigInt(reward.amount),
        distribution: distribution.map((dist) => [
          dist.percentage,
          dist.position,
        ]),
        submission_deadline: BigInt(submissionDeadline),
        judging_deadline: BigInt(judgingDeadline),
        title: title,
      });

      const result = await tx.simulate();
      const sentTx = await result.signAndSend();

      // await confirmation
      if (sentTx.result.isOk()) {
        return Number(sentTx.result.unwrap().toString());
      }

      throw new BlockchainError('Failed to create bounty', 'CONTRACT_ERROR');

      // TODO: Save to DB along with other details not saved in contract
    } catch (error) {
      console.error('Error creating bounty:', error);
      throw new BlockchainError('Failed to create bounty', 'TRANSACTION_ERROR');
    }
  }

  /**
   * Get all bounties
   */
  async getBounties(): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_bounties();
      const result = await tx.simulate();
      const bountyIds = result.result;
      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );
      return bounties;
    } catch (error) {
      console.error('Error getting bounties:', error);
      throw new BlockchainError('Failed to get bounties', 'CONTRACT_ERROR');
    }
  }

  /**
   * Get bounties for a specific user
   */
  async getUserBounties(user: string): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_user_bounties({
        user,
      });

      const result = await tx.simulate();

      // Get the individual bounties
      const bountyIds = result.result;
      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );
      return bounties;
    } catch (error) {
      console.error('Error getting user bounties:', error);
      throw new BlockchainError(
        'Failed to get user bounties',
        'CONTRACT_ERROR'
      );
    }
  }

  /**
   * Get bounties owned by a specific user
   */
  async getOwnerBounties(owner: string): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_owner_bounties({
        owner,
      });
      const result = await tx.simulate();
      const bountyIds = result.result;
      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );
      return bounties;
    } catch (error) {
      console.error('Error getting owner bounties:', error);
      throw new BlockchainError(
        'Failed to get owner bounties',
        'CONTRACT_ERROR'
      );
    }
  }

  /**
   * Get bounties by status
   */
  async getBountiesByStatus(status: BountyStatus): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_bounties_by_status({
        status,
      });
      const result = await tx.simulate();
      const bountyIds = result.result;
      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );
      return bounties;
    } catch (error) {
      console.error('Error getting bounties by status:', error);
      throw new BlockchainError(
        'Failed to get bounties by status',
        'CONTRACT_ERROR'
      );
    }
  }

  /**
   * Get bounties by token
   */
  async getBountiesByToken(token: string): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_bounties_by_token({
        token,
      });
      const result = await tx.simulate();
      const bountyIds = result.result;
      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );
      return bounties;
    } catch (error) {
      console.error('Error getting bounties by token:', error);
      throw new BlockchainError(
        'Failed to get bounties by token',
        'CONTRACT_ERROR'
      );
    }
  }

  /**
   * Get active bounties
   */
  async getActiveBounties(): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_active_bounties();
      const result = await tx.simulate();
      const bountyIds = result.result;

      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );

      return bounties;
    } catch (error) {
      console.error('Error getting active bounties:', error);
      throw new BlockchainError(
        'Failed to get active bounties',
        'CONTRACT_ERROR'
      );
    }
  }

  /**
   * Get bounty details
   */
  async getBounty(bountyId: number): Promise<ContractBounty> {
    try {
      const tx = await this.sorobanClient.get_bounty({
        bounty_id: bountyId,
      });
      const result = await tx.simulate();
      const sentTx = await result.signAndSend();

      // await confirmation
      if (sentTx.result.isOk()) {
        return sentTx.result.unwrap();
      }

      throw new BlockchainError('Failed to get bounty', 'CONTRACT_ERROR');
    } catch (error) {
      console.error('Error getting bounty:', error);
      throw new BlockchainError('Failed to get bounty', 'CONTRACT_ERROR');
    }
  }

  /**
   * Get submissions for a bounty
   */
  async getBountySubmissions(
    bountyId: number
  ): Promise<{ applicant: string; submission: string }[]> {
    try {
      const tx = await this.sorobanClient.get_bounty_submissions({
        bounty_id: bountyId,
      });
      const result = await tx.simulate();
      const submissions = result.result;

      const submissionsList = Array.from(submissions.entries()).map(
        ([applicant, submission]) => ({
          applicant,
          submission,
        })
      );
      return submissionsList;
    } catch (error) {
      console.error('Error getting bounty submissions:', error);
      throw new BlockchainError(
        'Failed to get bounty submissions',
        'CONTRACT_ERROR'
      );
    }
  }

  /**
   * Apply to a bounty
   */
  async applyToBounty(
    senderPublicKey: string,
    bountyId: number,
    content: string
  ): Promise<void> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      const tx = await this.sorobanClient.apply_to_bounty({
        applicant: senderPublicKey,
        bounty_id: bountyId,
        submission_link: content,
      });

      const result = await tx.simulate();
      const sentTx = await result.signAndSend();

      // await confirmation
      if (sentTx.result.isOk()) {
        return;
      }

      throw new BlockchainError('Failed to submit work', 'CONTRACT_ERROR');
    } catch (error) {
      console.error('Error submitting work:', error);
      throw new BlockchainError('Failed to submit work', 'CONTRACT_ERROR');
    }
  }

  /**
   * Update a bounty
   */
  async updateBounty(
    bountyId: number, 
    updates: {
      title?: string;
      distribution?: Array<readonly [number, number]>;
      submissionDeadline?: number;
    }
  ): Promise<void> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Create the transaction for updating the bounty
      // Matching contract method signature
      const tx = await this.sorobanClient.update_bounty({
        owner: this.publicKey,
        bounty_id: bountyId,
        new_title: updates.title ? updates.title : undefined,
        new_distribution: updates.distribution || [],
        new_submission_deadline: updates.submissionDeadline ? BigInt(updates.submissionDeadline) : undefined,
      });

      const result = await tx.simulate();
      const sentTx = await result.signAndSend();

      // await confirmation
      if (sentTx.result.isOk()) {
        return;
      }

      throw new BlockchainError('Failed to update bounty', 'CONTRACT_ERROR');
    } catch (error) {
      console.error('Error updating bounty:', error);
      throw new BlockchainError('Failed to update bounty', 'TRANSACTION_ERROR');
    }
  }

  /**
   * Delete a bounty
   */
  async deleteBounty(bountyId: number): Promise<void> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Create the transaction for deleting the bounty
      const tx = await this.sorobanClient.delete_bounty({
        owner: this.publicKey,
        bounty_id: bountyId,
      });

      const result = await tx.simulate();
      const sentTx = await result.signAndSend();

      // await confirmation
      if (sentTx.result.isOk()) {
        return;
      }

      throw new BlockchainError('Failed to delete bounty', 'CONTRACT_ERROR');
    } catch (error) {
      console.error('Error deleting bounty:', error);
      throw new BlockchainError('Failed to delete bounty', 'TRANSACTION_ERROR');
    }
  }

  /**
   * Select winners for a bounty
   */
  async selectWinners(
    bountyId: number,
    owner: string,
    winners: string[]
  ): Promise<void> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Create the transaction for selecting winners
      const tx = await this.sorobanClient.select_winners({
        owner,
        bounty_id: bountyId,
        winners,
      });

      const result = await tx.simulate();
      const sentTx = await result.signAndSend();

      // await confirmation
      if (sentTx.result.isOk()) {
        return;
      }

      throw new BlockchainError('Failed to select winners', 'CONTRACT_ERROR');
    } catch (error) {
      console.error('Error selecting winners:', error);
      throw new BlockchainError('Failed to select winners', 'TRANSACTION_ERROR');
    }
  }
}
