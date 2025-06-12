import { NextRequest, NextResponse } from 'next/server';
import { BlockchainError } from '@/utils/error-handler';
import { BountyService } from '@/lib/bountyService';

// Force dynamic rendering for APIs to work properly in production
export const dynamic = 'force-dynamic';

/**
 * GET /api/bounties
 * List all bounties with optional filtering
 * Backend handles fetching from both blockchain and database
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const token = searchParams.get('token');
    const owner = searchParams.get('owner');
    
    // Create service instance
    const bountyService = new BountyService();
    
    // Get all bounties (the service will combine blockchain and database data)
    let bounties: any[] = [];
    try {
      bounties = await bountyService.getAllBounties();
    } catch (fetchError) {
      console.error('Error fetching bounties from service:', fetchError);
      // Return empty array instead of failing completely
      bounties = [];
    }
    
    // Apply filters if needed
    let filteredBounties = bounties;
    
    if (status) {
      filteredBounties = filteredBounties.filter(b => b.status === status);
    }
    
    if (token) {
      filteredBounties = filteredBounties.filter(b => b.reward.asset === token);
    }
    
    if (owner) {
      filteredBounties = filteredBounties.filter(b => b.owner === owner);
    }
    
    return NextResponse.json(filteredBounties);
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bounties', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bounties
 * This endpoint is called AFTER the blockchain transaction
 * It saves the off-chain data to the database
 */
export async function POST(request: NextRequest) {
  try {
    const {
      blockchainBountyId, // This comes from the frontend after blockchain creation
      description,
      category,
      skills,
      extraRequirements,
    } = await request.json();

    // Validate required fields
    if (
      !blockchainBountyId ||
      !description ||
      !category ||
      !skills
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService();
    
    // Save to database using the blockchain-generated ID
    await bountyService.saveBountyToDatabase(
      blockchainBountyId,
      {
        description,
        category,
        skills,
        extraRequirements
      }
    );

    return NextResponse.json({ 
      success: true, 
      id: blockchainBountyId,
      message: 'Bounty saved successfully'
    });
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
