import { NextRequest, NextResponse } from 'next/server';
import { SorobanService } from '@/lib/soroban';
import { BlockchainError } from '@/utils/error-handler';

// Initialize the Soroban service
const sorobanService = new SorobanService();

/**
 * GET /api/bounties/[id]/submissions/[submissionId]
 * Get a specific submission for a bounty
 */
export async function GET(
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

    // TODO: Implement getSubmission in SorobanService
    // This would be where we would call the get_submission function on the contract
    // For now, return a mock submission

    const mockSubmission = {
      id: submissionId,
      bountyId: id,
      applicant: 'GBVHXVE5DGGGOFT3GC4PFVZVFDI6EYUAFHR45PHFMMRN3VCSCDIKCFND',
      content: 'I have completed this task by implementing the requested features...',
      created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING'
    };
    
    return NextResponse.json({ submission: mockSubmission });
  } catch (error) {
    console.error(`Error fetching submission ${params.submissionId} for bounty ${params.id}:`, error);
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
 * Accept, reject, or rank a submission
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
      // Validate ranking is 1, 2, or 3
      if (![1, 2, 3].includes(ranking) && ranking !== null) {
        return NextResponse.json(
          { error: 'Ranking must be 1, 2, 3, or null' },
          { status: 400 }
        );
      }

      // TODO: Implement updateSubmissionRanking in SorobanService
      // For now, return a mock success response
      
      return NextResponse.json({ 
        success: true,
        message: ranking ? `Submission ranked #${ranking} successfully` : 'Ranking removed successfully',
        id: submissionId,
        bountyId: id,
        ranking
      });
    }

    // Handle accept and rank actions only, removing reject functionality
    if (!action || !['accept'].includes(action) && !(action === 'rank' && ranking !== undefined)) {
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
        submissionId,
        signedXdr ? () => Promise.resolve(signedXdr) : mockSign
      );

      return NextResponse.json({ 
        success: true,
        message: 'Submission accepted successfully',
        id: submissionId,
        bountyId: id,
        status: 'ACCEPTED'
      });
    }
  } catch (error) {
    console.error(`Error processing submission ${params.submissionId} for bounty ${params.id}:`, error);
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