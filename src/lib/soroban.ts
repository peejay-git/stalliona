import { Distribution } from '@/types/bounty';
import { BlockchainError } from '@/utils/error-handler';
import { WalletNetwork } from '@creit.tech/stellar-wallets-kit';
import freighterApi from '@stellar/freighter-api';
import {
  Status as BountyStatus,
  Bounty as ContractBounty,
  Client as SorobanClient,
} from '../../packages/stallion/src/index';
import { kit } from './wallet';

// Environment variables with defaults
const CONTRACT_ID = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID || '';
const NETWORK =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'Public'
    ? WalletNetwork.PUBLIC
    : WalletNetwork.TESTNET;

const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  'https://soroban-testnet.stellar.org';

// Only throw in development environment, in production we'll show appropriate UI
if (
  process.env.NODE_ENV === 'development' &&
  (!CONTRACT_ID || !NETWORK || !SOROBAN_RPC_URL)
) {
  console.error('Missing required environment variables for Soroban:', {
    CONTRACT_ID: !!CONTRACT_ID,
    NETWORK: !!NETWORK,
    SOROBAN_RPC_URL: !!SOROBAN_RPC_URL,
  });
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
      // Log environment variables and configuration
      console.log('=== SOROBAN SERVICE CONFIGURATION ===');
      console.log(`Contract ID: ${CONTRACT_ID}`);
      console.log(`Network: ${NETWORK}`);
      console.log(`RPC URL: ${SOROBAN_RPC_URL}`);
      console.log(`Public Key: ${publicKey || 'Not provided'}`);

      if (!CONTRACT_ID || CONTRACT_ID.length < 10) {
        console.error('Warning: Contract ID appears to be invalid or missing');
      }

      if (!NETWORK) {
        console.error('Warning: Network passphrase is missing');
      }

      if (!SOROBAN_RPC_URL) {
        console.error('Warning: Soroban RPC URL is missing');
      }

      // Initialize the Soroban client for contract interactions
      this.sorobanClient = new SorobanClient({
        contractId: this.contractId,
        networkPassphrase: this.network,
        rpcUrl: SOROBAN_RPC_URL,
        publicKey: this.publicKey || '',
      });

      // Initialize wallet connection if no public key provided
      if (!this.publicKey) {
        freighterApi.isConnected().then((connected) => {
          if (connected) {
            freighterApi.getPublicKey().then((publicKey) => {
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
  }: {
    title: string;
    owner: string;
    token: string;
    reward: { amount: string; asset: string };
    distribution: Distribution[];
    submissionDeadline: number;
  }): Promise<number> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Set judging deadline to 365 days after submission deadline
      // This effectively means "no deadline" as owners can select winners anytime
      const calculatedJudgingDeadline = submissionDeadline + (365 * 24 * 60 * 60 * 1000);

      console.log(`=== CREATE BOUNTY DETAILS ===`);
      console.log(`Owner: ${owner}`);
      console.log(`Token: ${token}`);
      console.log(`Reward: ${reward.amount} ${reward.asset}`);
      console.log(`Distribution: ${JSON.stringify(distribution)}`);
      console.log(
        `Submission Deadline: ${new Date(
          submissionDeadline
        ).toISOString()} (${submissionDeadline})`
      );
      console.log(
        `Judging Deadline: ${new Date(
          calculatedJudgingDeadline
        ).toISOString()} (${calculatedJudgingDeadline})`
      );
      console.log(`Title: ${title}`);
      console.log(`Contract ID: ${this.contractId}`);
      console.log(`Network: ${this.network}`);
      console.log(`Wallet: ${this.publicKey}`);

      // Validate parameters before sending to the blockchain
      if (!owner || owner.trim() === '') {
        throw new Error('Invalid owner address');
      }

      if (!token || token.trim() === '') {
        throw new Error('Invalid token');
      }

      if (
        !reward.amount ||
        isNaN(Number(reward.amount)) ||
        Number(reward.amount) <= 0
      ) {
        throw new Error('Invalid reward amount');
      }

      if (distribution.length === 0) {
        throw new Error('Distribution cannot be empty');
      }

      if (submissionDeadline <= Date.now()) {
        throw new Error('Submission deadline must be in the future');
      }

      if (calculatedJudgingDeadline <= submissionDeadline) {
        throw new Error('Judging deadline must be after submission deadline');
      }

      try {
        // Prepare transaction
        console.log('Preparing transaction...');
        console.log('Using token address:', token); // Log the token address being used
        const tx = await this.sorobanClient.create_bounty({
          owner: owner,
          token: token, // Use the token address passed in as a parameter
          reward: BigInt(reward.amount),
          distribution: distribution.map((dist) => [
            dist.position,
            dist.percentage,
          ]),
          submission_deadline: BigInt(submissionDeadline),
          judging_deadline: BigInt(calculatedJudgingDeadline),
          title: title,
        });

        console.log('Transaction prepared, simulating...');

        // Simulate to ensure transaction is valid
        try {
          const result = await tx.simulate();
          console.log('Simulation result:', JSON.stringify(result, null, 2));

          // The result object might contain errors in various formats
          // Using type assertion since the exact structure can vary
          const resultAny = result as any;
          if (resultAny.simulationError || resultAny.error) {
            const errorDetails = resultAny.simulationError || resultAny.error;
            console.error('Simulation failed:', errorDetails);
            throw new Error(
              `Simulation error: ${JSON.stringify(errorDetails)}`
            );
          }

          // Sign and send the transaction to the blockchain
          console.log('Sending transaction to wallet for approval...');
          const sentTx = await result.signAndSend({
            signTransaction: (transaction) => {
              return kit.signTransaction(transaction);
            },
          });
          console.log('Transaction sent, waiting for result...');

          // await confirmation
          if (sentTx.result.isOk()) {
            const bountyId = Number(sentTx.result.unwrap().toString());
            console.log(`Bounty created successfully with ID: ${bountyId}`);
            return bountyId;
          }

          // If we get here, there was a problem
          const errorMsg = sentTx.result.isErr()
            ? sentTx.result.unwrapErr()
            : 'Unknown error';
          console.error('Transaction failed:', errorMsg);
          throw new BlockchainError(
            `Transaction failed: ${JSON.stringify(errorMsg)}`,
            'CONTRACT_ERROR'
          );
        } catch (simulateError: any) {
          console.error('Simulation failed:', simulateError);
          throw new Error(
            `Failed to simulate transaction: ${
              simulateError?.message || JSON.stringify(simulateError)
            }`
          );
        }
      } catch (contractError: any) {
        console.error('Contract interaction failed:', contractError);
        throw new Error(
          `Contract error: ${
            contractError?.message || JSON.stringify(contractError)
          }`
        );
      }
    } catch (error) {
      console.error('Error creating bounty:', error);
      if (error instanceof BlockchainError) {
        throw error;
      }
      throw new BlockchainError(
        error instanceof Error ? error.message : 'Failed to create bounty',
        'TRANSACTION_ERROR'
      );
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

      // Convert the Map to an array of objects
      if (submissions && typeof submissions === 'object') {
        const submissionsList: { applicant: string; submission: string }[] = [];
        
        // Handle the case where submissions might be a Map-like object
        for (const [applicant, submission] of Object.entries(submissions)) {
          submissionsList.push({
          applicant,
            submission: String(submission),
          });
        }
        
      return submissionsList;
      }
      
      return [];
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
        new_submission_deadline: updates.submissionDeadline
          ? BigInt(updates.submissionDeadline)
          : undefined,
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

      console.log('Selecting winners:', {
        bountyId,
        owner,
        winners,
        publicKey: this.publicKey
      });

      // Create the transaction for selecting winners
      const tx = await this.sorobanClient.select_winners({
        owner,
        bounty_id: bountyId,
        winners,
      });

      // Simulate the transaction first
      const result = await tx.simulate();
      console.log('Simulation result:', result);

      // Check for simulation errors
      const resultAny = result as any;
      if (resultAny.simulationError || resultAny.error) {
        const errorDetails = resultAny.simulationError || resultAny.error;
        console.error('Simulation failed:', errorDetails);
        throw new Error(`Simulation error: ${JSON.stringify(errorDetails)}`);
      }

      // Sign and send the transaction
      console.log('Sending transaction to wallet for approval...');
      const sentTx = await result.signAndSend({
        signTransaction: (transaction) => {
          return kit.signTransaction(transaction);
        },
      });
      console.log('Transaction sent, waiting for result...');

      // Check the result
      if (sentTx.result.isOk()) {
        console.log('Winners selected successfully');
        return;
      }

      // If we get here, there was a problem
      const errorMsg = sentTx.result.isErr()
        ? sentTx.result.unwrapErr()
        : 'Unknown error';
      console.error('Transaction failed:', errorMsg);
      throw new BlockchainError(
        `Transaction failed: ${JSON.stringify(errorMsg)}`,
        'CONTRACT_ERROR'
      );
    } catch (error) {
      console.error('Error selecting winners:', error);
      throw new BlockchainError(
        error instanceof Error ? error.message : 'Failed to select winners',
        'TRANSACTION_ERROR'
      );
    }
  }
}