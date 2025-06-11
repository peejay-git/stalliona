import { NextRequest, NextResponse } from 'next/server';
import { BountyService } from '@/lib/bountyService';
import { BlockchainError } from '@/utils/error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bounties/[id]/winners
 * Get winners for a bounty
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService();
    
    // Get the winners for the bounty
    const winners = await bountyService.getBountyWinners(id);

    return NextResponse.json(winners);
  } catch (error) {
    console.error(`Error fetching winners for bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bounties/[id]/winners
 * Select winners for a bounty
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const { winnerAddresses, userPublicKey } = await request.json();

    // Validate required fields
    if (!winnerAddresses || !Array.isArray(winnerAddresses) || !userPublicKey) {
      return NextResponse.json(
        { error: 'Winner addresses and user public key are required' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService(userPublicKey);
    
    // Select winners for the bounty
    await bountyService.selectBountyWinners(
      parseInt(id),
      winnerAddresses,
      userPublicKey
    );

    return NextResponse.json({
      success: true,
      message: 'Winners selected successfully',
    });
  } catch (error) {
    console.error(`Error selecting winners for bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to select winners' },
      { status: 500 }
    );
  }
} 