import { NextRequest, NextResponse } from 'next/server';
import { SorobanService } from '@/lib/soroban';
import { BlockchainError } from '@/utils/error-handler';
import { BountyCategory, BountyStatus } from '@/types/bounty';

// Initialize the Soroban service
// TODO: Pass in the publicKey of the currently signed in user
const sorobanService = new SorobanService();

/**
 * GET /api/bounties/[id]
 * Get a bounty by ID
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

    // Get the bounty from the contract
    // TODO: Fetch these from the database instead
    const bounty = await sorobanService.getBounty(Number(id));

    return NextResponse.json({ bounty });
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

    // Parse the request body
    const body = await request.json();

    // Validate the request
    const {
      title,
      description,
      rewardAmount,
      rewardAsset,
      deadline,
      status,
      category,
      skills,
      senderPublicKey,
      signedXdr,
    } = body;

    if (!senderPublicKey) {
      return NextResponse.json(
        { error: 'Sender public key is required' },
        { status: 400 }
      );
    }

    // Check if status is valid if provided
    if (status && !Object.values(BountyStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if category is valid if provided
    if (category && !Object.values(BountyCategory).includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Mock signing function for testing
    const mockSign = async (xdr: string) => {
      console.log('Signing transaction:', xdr);
      return 'signed_' + xdr;
    };

    // TODO: Implement updateBounty in SorobanService
    // This would be where we would call the update_bounty function on the contract
    // For now, return a mock success response

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
 * Cancel a bounty by ID
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

    // Parse the request body
    const body = await request.json();

    // Validate the request
    const { senderPublicKey, signedXdr } = body;

    if (!senderPublicKey) {
      return NextResponse.json(
        { error: 'Sender public key is required' },
        { status: 400 }
      );
    }

    // Mock signing function for testing
    const mockSign = async (xdr: string) => {
      console.log('Signing transaction:', xdr);
      return 'signed_' + xdr;
    };

    // TODO: Implement cancelBounty in SorobanService
    // This would be where we would call the cancel_bounty function on the contract
    // For now, return a mock success response

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
