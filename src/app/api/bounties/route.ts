import { BountyService } from '@/lib/bountyService';
import { BlockchainError } from '@/utils/error-handler';
import { NextRequest, NextResponse } from 'next/server';

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
      filteredBounties = filteredBounties.filter((b) => b.status === status);
    }

    if (token) {
      filteredBounties = filteredBounties.filter(
        (b) => b.reward.asset === token
      );
    }

    if (owner) {
      filteredBounties = filteredBounties.filter((b) => b.owner === owner);
    }

    return NextResponse.json(filteredBounties);
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bounties',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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
    console.log("API route - POST /api/bounties - Request received");
    
    const requestBody = await request.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const {
      blockchainBountyId, // This comes from the frontend after blockchain creation
      description,
      category,
      skills,
      extraRequirements,
      owner, // Owner address
      title, // Bounty title
      reward, // Reward amount and token type
      deadline, // Submission deadline
      submissionDeadline, // Explicit submission deadline
      judgingDeadline, // Judging deadline
      status, // Bounty status
      sponsorName, // Sponsor company name
    } = requestBody;

    console.log("Extracted values:", {
      blockchainBountyId,
      description: description?.substring(0, 50) + "...",
      category,
      skills,
      extraRequirements: extraRequirements || "(empty)",
      owner: owner || "(missing)",
      title: title || "(missing)",
      reward: reward || "(missing)",
      deadline: deadline || "(missing)",
      submissionDeadline: submissionDeadline || "(missing)",
      judgingDeadline: judgingDeadline || "(missing)",
      status: status || "(missing)",
      sponsorName: sponsorName || "(missing)",
    });

    // Validate required fields
    if (
      blockchainBountyId === null ||
      blockchainBountyId === undefined ||
      !description ||
      !category ||
      !skills ||
      !owner // Validate owner field
    ) {
      console.error("Validation failed:", { 
        blockchainBountyId: blockchainBountyId === null || blockchainBountyId === undefined,
        description: !description,
        category: !category,
        skills: !skills,
        owner: !owner
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure blockchainBountyId is a number
    const numericBountyId = Number(blockchainBountyId);
    if (isNaN(numericBountyId)) {
      console.error("Invalid blockchainBountyId:", blockchainBountyId);
      return NextResponse.json(
        { error: 'Invalid blockchainBountyId format' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService();

    // Save to database using the blockchain-generated ID
    await bountyService.saveBountyToDatabase(numericBountyId, {
      description: description || '',
      category: category || '',
      skills: Array.isArray(skills) ? skills : [],
      extraRequirements: extraRequirements || '',
      owner: owner || '',
      title: title || '',
      reward: typeof reward === 'object' ? JSON.stringify(reward) : reward || '',
      deadline: deadline || new Date().toISOString(),
      submissionDeadline: submissionDeadline || deadline || new Date().toISOString(),
      judgingDeadline: judgingDeadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: status || 'OPEN',
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      id: blockchainBountyId,
      message: 'Bounty saved successfully',
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
