import { NextRequest, NextResponse } from 'next/server';
import { BlockchainError } from '@/utils/error-handler';
import { BountyService } from '@/lib/bountyService';

/**
 * GET /api/bounties/[id]
 * Get a bounty by ID
 * Backend handles fetching both blockchain and database data
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
    
    // Get the complete bounty (combining blockchain and database data)
    const bounty = await bountyService.getBountyById(id);

    return NextResponse.json(bounty);
  } catch (error) {
    console.error(`Error fetching bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch bounty' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bounties/[id]
 * Update a bounty by ID
 * This is called AFTER the blockchain update
 */
export async function PUT(
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

    // Parse the request body - only expecting off-chain data updates
    const {
      description,
      category,
      skills,
      extraRequirements,
    } = await request.json();

    // Create bounty service and update the database
    const bountyService = new BountyService();
    
    // Update off-chain data
    await bountyService.saveBountyToDatabase(
      parseInt(id),
      {
        description: description || '',
        category: category || '',
        skills: skills || [],
        extraRequirements,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Bounty updated successfully',
      id,
    });
  } catch (error) {
    console.error(`Error updating bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update bounty' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bounties/[id]
 * Delete a bounty's off-chain data
 * This should be called after the blockchain operation
 */
export async function DELETE(
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

    // For now, we're not actually implementing deletion of off-chain data
    // This would depend on your requirements - you might want to keep the data
    // for historical purposes even if the bounty is cancelled on-chain

    return NextResponse.json({
      success: true,
      message: 'Bounty cancelled successfully',
      id,
    });
  } catch (error) {
    console.error(`Error cancelling bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to cancel bounty' },
      { status: 500 }
    );
  }
}
