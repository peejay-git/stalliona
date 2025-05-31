import { NextRequest, NextResponse } from 'next/server';
import { SorobanService } from '@/lib/soroban';
import { BlockchainError } from '@/utils/error-handler';

// Initialize the Soroban service
// TODO: Pass in the publicKey of the currently signed in user
const sorobanService = new SorobanService();

/**
 * GET /api/bounties/[id]/submissions/[user]
 * Get a specific submission for a bounty
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; user: string } }
) {
  try {
    const { id, user } = params;
    if (!id || !user) {
      return NextResponse.json(
        { error: 'Bounty ID and Submission ID are required' },
        { status: 400 }
      );
    }

    // TODO: Fetch these from the database instead
    const submission = await sorobanService.getSubmission(Number(id), user);

    return NextResponse.json({ submission });
  } catch (error) {
    console.error(`Error fetching submission for user ${params.user}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bounties/[id]/submissions/[submissionId]
 * Rank a submission
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const { id, submissionId } = params;
    if (!id || !submissionId) {
      return NextResponse.json(
        { error: 'Bounty ID and Submission ID are required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Validate the request
    const { action, senderPublicKey, signedXdr, ranking } = body;

    // Check if it's a ranking update
    if (action === 'rank' && ranking !== undefined) {
      await sorobanService.selectWinner(
        senderPublicKey,
        Number(id),
        Number(submissionId),
        ranking
      );
      return NextResponse.json({
        success: true,
        message: 'Submission ranked successfully',
        id: submissionId,
        bountyId: id,
        ranking,
      });
    }

    // Handle accept and rank actions only, removing reject functionality
    if (
      !action ||
      (!['accept'].includes(action) &&
        !(action === 'rank' && ranking !== undefined))
    ) {
      return NextResponse.json(
        { error: 'Valid action (accept or rank) is required' },
        { status: 400 }
      );
    }

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

    if (action === 'accept') {
      // Accept the submission
      await sorobanService.acceptSubmission(
        senderPublicKey,
        Number(submissionId),
        signedXdr ? () => Promise.resolve(signedXdr) : mockSign
      );

      return NextResponse.json({
        success: true,
        message: 'Submission accepted successfully',
        id: submissionId,
        bountyId: id,
        status: 'ACCEPTED',
      });
    }
  } catch (error) {
    console.error(
      `Error processing submission ${params.submissionId} for bounty ${params.id}:`,
      error
    );
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
