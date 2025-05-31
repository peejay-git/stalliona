import { SorobanService } from '@/lib/soroban';
import { NextRequest, NextResponse } from 'next/server';
import {
  Status as BountyStatus,
  Bounty as ContractBounty,
} from '../../../../packages/stallion/src';
import { BlockchainError } from '@/utils/error-handler';

// Initialize the Soroban service
// TODO: Pass in the publicKey of the currently signed in user
const sorobanService = new SorobanService();

/**
 * GET /api/bounties
 * List all bounties with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as BountyStatus | null;
    const token = searchParams.get('token');
    const owner = searchParams.get('owner');

    let bounties: ContractBounty[];

    // TODO: Fetch these from the database instead
    if (status) {
      bounties = await sorobanService.getBountiesByStatus(status);
    } else if (token) {
      bounties = await sorobanService.getBountiesByToken(token);
    } else if (owner) {
      bounties = await sorobanService.getOwnerBounties(owner);
    } else {
      bounties = await sorobanService.getActiveBounties();
    }

    return NextResponse.json(bounties);
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bounties' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bounties
 * Create a new bounty
 */
export async function POST(request: NextRequest) {
  try {
    const {
      owner,
      token,
      reward,
      distribution,
      submissionDeadline,
      judgingDeadline,
      title,
      description,
      category,
      skills,
    } = await request.json();

    // Validate required fields
    if (
      !owner ||
      !token ||
      !reward ||
      !distribution ||
      !submissionDeadline ||
      !judgingDeadline ||
      !title ||
      !description ||
      !category ||
      !skills
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create bounty on the blockchain
    const bountyId = await sorobanService.createBounty({
      owner,
      token,
      reward: { amount: reward.amount, asset: reward.asset },
      distribution,
      submissionDeadline,
      judgingDeadline,
      title,
    });

    // TODO: Save to DB and return

    return NextResponse.json({ id: bountyId });
  } catch (error) {
    console.error('Error creating bounty:', error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create bounty' },
      { status: 500 }
    );
  }
}
