import { Bounty, BountyStatus, BountyCategory } from '@/types/bounty';
import { BlockchainError } from '@/utils/error-handler';
import * as StellarSdk from 'stellar-sdk';

// Environment variables with defaults
const CONTRACT_ID = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID || 'mock_contract';
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET';
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_CLIENT === 'true';

/**
 * Soroban service for interacting with the bounty contract
 */
export class SorobanService {
  private contractId: string;
  private network: string;
  private server: any = null;
  private contract: any = null;
  private useMock: boolean;

  constructor(
    contractId: string = CONTRACT_ID,
    network: string = NETWORK,
    sorobanRpcUrl: string = SOROBAN_RPC_URL,
    useMock: boolean = USE_MOCK
  ) {
    this.contractId = contractId;
    this.network = network;
    this.useMock = useMock;

    if (!this.useMock) {
      try {
        // Initialize server and contract using StellarSdk
        this.server = new StellarSdk.SorobanRpc.Server(sorobanRpcUrl);
        this.contract = new StellarSdk.Contract(contractId);
        console.log(`Initialized Soroban service with contract: ${contractId} on network: ${network}`);
      } catch (error) {
        console.error("Error initializing Soroban client:", error);
        throw new BlockchainError('Failed to initialize Soroban client', 'CONNECTION_ERROR');
      }
    } else {
      console.log(`Initializing mock Soroban service with contract: ${contractId} on network: ${network}`);
    }
  }

  /**
   * Create a new bounty
   */
  async createBounty(
    senderPublicKey: string,
    title: string,
    description: string,
    rewardAmount: string,
    rewardAsset: string,
    deadline: number, // Unix timestamp in seconds
    category: BountyCategory,
    skills: string[],
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<string> {
    if (this.useMock) {
      return this.mockCreateBounty(
        senderPublicKey, 
        title, 
        description, 
        rewardAmount, 
        rewardAsset, 
        deadline, 
        category, 
        skills
      );
    }

    try {
      if (!this.server || !this.contract) {
        throw new BlockchainError('Soroban client not initialized', 'CONNECTION_ERROR');
      }

      // Mock implementation for now - to be replaced with real implementation
      console.log('Creating bounty with params:', {
        senderPublicKey,
        title,
        description,
        rewardAmount,
        rewardAsset,
        deadline,
        category,
        skills
      });
      
      // Simulate a delay to mimic blockchain transaction
      await new Promise(r => setTimeout(r, 1000));
      
      // Return a mock ID
      return "mock_bounty_id_" + Date.now().toString();
    } catch (error) {
      console.error('Error creating bounty:', error);
      if (error instanceof BlockchainError) {
        throw error;
      }
      throw new BlockchainError('Failed to create bounty', 'CONTRACT_ERROR');
    }
  }

  /**
   * Get a bounty by ID
   */
  async getBounty(bountyId: string): Promise<Bounty> {
    if (this.useMock) {
      return this.mockBountyResponse(bountyId);
    }

    try {
      if (!this.server || !this.contract) {
        throw new BlockchainError('Soroban client not initialized', 'CONNECTION_ERROR');
      }

      // Mock implementation for now - to be replaced with real implementation
      await new Promise(r => setTimeout(r, 500));
      return this.mockBountyResponse(bountyId);
    } catch (error) {
      console.error('Error getting bounty:', error);
      if (error instanceof BlockchainError) {
        throw error;
      }
      throw new BlockchainError('Failed to get bounty', 'CONTRACT_ERROR');
    }
  }

  /**
   * List all bounties
   */
  async listBounties(): Promise<Bounty[]> {
    if (this.useMock) {
      return this.mockBountiesResponse();
    }

    try {
      if (!this.server || !this.contract) {
        throw new BlockchainError('Soroban client not initialized', 'CONNECTION_ERROR');
      }

      // Mock implementation for now - to be replaced with real implementation
      await new Promise(r => setTimeout(r, 800));
      return this.mockBountiesResponse();
    } catch (error) {
      console.error('Error listing bounties:', error);
      if (error instanceof BlockchainError) {
        throw error;
      }
      throw new BlockchainError('Failed to list bounties', 'CONTRACT_ERROR');
    }
  }

  /**
   * Submit work for a bounty
   */
  async submitWork(
    senderPublicKey: string,
    bountyId: string,
    content: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<string> {
    if (this.useMock) {
      return this.mockSubmitWork(senderPublicKey, bountyId, content);
    }

    try {
      if (!this.server || !this.contract) {
        throw new BlockchainError('Soroban client not initialized', 'CONNECTION_ERROR');
      }

      // Mock implementation for now - to be replaced with real implementation
      console.log('Submitting work:', { senderPublicKey, bountyId, content });
      await new Promise(r => setTimeout(r, 1000));
      return "mock_submission_id_" + Date.now().toString();
    } catch (error) {
      console.error('Error submitting work:', error);
      if (error instanceof BlockchainError) {
        throw error;
      }
      throw new BlockchainError('Failed to submit work', 'CONTRACT_ERROR');
    }
  }

  /**
   * Accept a submission
   */
  async acceptSubmission(
    senderPublicKey: string,
    submissionId: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<void> {
    if (this.useMock) {
      return this.mockAcceptSubmission(senderPublicKey, submissionId);
    }

    try {
      if (!this.server || !this.contract) {
        throw new BlockchainError('Soroban client not initialized', 'CONNECTION_ERROR');
      }

      // Mock implementation for now - to be replaced with real implementation
      console.log('Accepting submission:', { senderPublicKey, submissionId });
      await new Promise(r => setTimeout(r, 1000));
      return;
    } catch (error) {
      console.error('Error accepting submission:', error);
      if (error instanceof BlockchainError) {
        throw error;
      }
      throw new BlockchainError('Failed to accept submission', 'CONTRACT_ERROR');
    }
  }

  // MOCK IMPLEMENTATIONS

  /**
   * Mock create bounty
   */
  private async mockCreateBounty(
    senderPublicKey: string,
    title: string,
    description: string,
    rewardAmount: string,
    rewardAsset: string,
    deadline: number,
    category: BountyCategory,
    skills: string[]
  ): Promise<string> {
    // Log the creation request
    console.log('Creating mock bounty with params:', {
      senderPublicKey,
      title,
      description,
      rewardAmount,
      rewardAsset,
      deadline,
      category,
      skills
    });
    
    // Simulate a delay
    await new Promise(r => setTimeout(r, 1000));
    
    // Return a mock ID
    return "mock_bounty_id_" + Date.now().toString();
  }

  /**
   * Mock submit work
   */
  private async mockSubmitWork(
    senderPublicKey: string,
    bountyId: string,
    content: string
  ): Promise<string> {
    // Log the submission details
    console.log('Submitting mock work:', { senderPublicKey, bountyId, content });
    
    // Simulate a delay
    await new Promise(r => setTimeout(r, 1000));
    
    // Return a mock submission ID
    return "mock_submission_id_" + Date.now().toString();
  }

  /**
   * Mock accept submission
   */
  private async mockAcceptSubmission(
    senderPublicKey: string,
    submissionId: string
  ): Promise<void> {
    // Log the acceptance
    console.log('Accepting mock submission:', { senderPublicKey, submissionId });
    
    // Simulate a delay
    await new Promise(r => setTimeout(r, 1000));
    
    return;
  }

  /**
   * Mock bounty response for testing
   */
  private mockBountyResponse(id: string): Bounty {
    return {
      id,
      title: 'Example Bounty',
      description: 'This is a mock bounty for testing purposes',
      reward: {
        amount: '500',
        asset: 'USDC',
      },
      owner: 'GBVHXVE5DGGGOFT3GC4PFVZVFDI6EYUAFHR45PHFMMRN3VCSCDIKCFND',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: BountyStatus.OPEN,
      category: BountyCategory.DEVELOPMENT,
      skills: ['Rust', 'Soroban', 'Smart Contracts'],
      created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Mock bounties list response for testing
   */
  private mockBountiesResponse(): Bounty[] {
    return [
      {
        id: '1',
        title: 'Build a Stellar Wallet Integration',
        description: 'Create a seamless wallet integration for our platform using Soroban smart contracts',
        reward: { amount: '500', asset: 'USDC' },
        owner: 'GBVHXVE5DGGGOFT3GC4PFVZVFDI6EYUAFHR45PHFMMRN3VCSCDIKCFND',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: BountyStatus.OPEN,
        category: BountyCategory.DEVELOPMENT,
        skills: ['React', 'TypeScript', 'Stellar SDK'],
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        title: 'Design DeFi Dashboard UI',
        description: 'Create a modern UI design for our DeFi dashboard featuring charts and analytics',
        reward: { amount: '350', asset: 'USDC' },
        owner: 'GDFCYBELWTBX3EOAFRGOXPQO23YYHZ6XAKBCTTGP3MQKH3G6VNLRO3Q',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: BountyStatus.OPEN,
        category: BountyCategory.DESIGN,
        skills: ['UI/UX', 'Figma', 'Dashboard Design'],
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        title: 'Smart Contract for Token Vesting',
        description: 'Implement a Soroban contract for token vesting with configurable schedules',
        reward: { amount: '800', asset: 'USDC' },
        owner: 'GBVHXVE5DGGGOFT3GC4PFVZVFDI6EYUAFHR45PHFMMRN3VCSCDIKCFND',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        status: BountyStatus.IN_PROGRESS,
        category: BountyCategory.DEVELOPMENT,
        skills: ['Rust', 'Soroban', 'Smart Contracts'],
        created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
} 