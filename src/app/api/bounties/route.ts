import { NextRequest, NextResponse } from 'next/server';
import { SorobanService } from '@/lib/soroban';
import { BlockchainError } from '@/utils/error-handler';
import { BountyCategory } from '@/types/bounty';

// Initialize the Soroban service
const sorobanService = new SorobanService();

/**
 * GET /api/bounties
 * List all bounties with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const minReward = searchParams.get('minReward');
    const maxReward = searchParams.get('maxReward');
    const skill = searchParams.get('skill');

    // Get all bounties from the contract
    const bounties = await sorobanService.listBounties();

    // Apply filters if provided
    let filteredBounties = bounties;
    
    if (status) {
      const statuses = status.split(',');
      filteredBounties = filteredBounties.filter(bounty => 
        statuses.includes(bounty.status)
      );
    }
    
    if (category) {
      const categories = category.split(',');
      filteredBounties = filteredBounties.filter(bounty => 
        categories.includes(bounty.category)
      );
    }
    
    if (minReward) {
      const minRewardValue = parseInt(minReward);
      filteredBounties = filteredBounties.filter(bounty => 
        parseInt(bounty.reward.amount) >= minRewardValue
      );
    }
    
    if (maxReward) {
      const maxRewardValue = parseInt(maxReward);
      filteredBounties = filteredBounties.filter(bounty => 
        parseInt(bounty.reward.amount) <= maxRewardValue
      );
    }
    
    if (skill) {
      filteredBounties = filteredBounties.filter(bounty => 
        bounty.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
    }
    
    return NextResponse.json({ bounties: filteredBounties });
  } catch (error) {
    console.error('Error fetching bounties:', error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
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
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { title, description, rewardAmount, rewardAsset, deadline, category, skills, senderPublicKey, signedXdr } = body;

    if (!title || !description || !rewardAmount || !rewardAsset || !deadline || !category || !skills || !senderPublicKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the category is valid
    if (!Object.values(BountyCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Mock signing function for testing
    const mockSign = async (xdr: string) => {
      console.log('Signing transaction:', xdr);
      return 'signed_' + xdr;
    };

    // Create the bounty
    const bountyId = await sorobanService.createBounty(
      senderPublicKey,
      title,
      description,
      rewardAmount,
      rewardAsset,
      deadline,
      category,
      skills,
      signedXdr ? () => Promise.resolve(signedXdr) : mockSign
    );

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