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
 * Accept or reject a submission
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
    const { action, senderPublicKey, signedXdr } = body;

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (accept or reject) is required' },
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
    } else {
      // TODO: Implement rejectSubmission in SorobanService
      // For now, return a mock success response
      
      return NextResponse.json({ 
        success: true,
        message: 'Submission rejected successfully',
        id: submissionId,
        bountyId: id,
        status: 'REJECTED'
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