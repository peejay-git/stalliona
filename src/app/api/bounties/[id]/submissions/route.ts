import { NextRequest, NextResponse } from 'next/server';
import { SorobanService } from '@/lib/soroban';
import { BlockchainError } from '@/utils/error-handler';

// Initialize the Soroban service
const sorobanService = new SorobanService();

/**
 * GET /api/bounties/[id]/submissions
 * Get all submissions for a bounty
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

    // TODO: Implement getSubmissions in SorobanService
    // This would be where we would call the list_submissions function on the contract
    // For now, return mock submissions

    const mockSubmissions = [
      {
        id: 'submission1',
        bountyId: id,
        applicant: 'GBVHXVE5DGGGOFT3GC4PFVZVFDI6EYUAFHR45PHFMMRN3VCSCDIKCFND',
        content: 'I have completed this task by implementing the requested features...',
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING'
      },
      {
        id: 'submission2',
        bountyId: id,
        applicant: 'GDFCYBELWTBX3EOAFRGOXPQO23YYHZ6XAKBCTTGP3MQKH3G6VNLRO3Q',
        content: 'Here is my implementation of the requested functionality...',
        created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING'
      }
    ];
    
    return NextResponse.json({ submissions: mockSubmissions });
  } catch (error) {
    console.error(`Error fetching submissions for bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bounties/[id]/submissions
 * Submit work for a bounty
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
    const body = await request.json();
    
    // Validate the request
    const { content, senderPublicKey, signedXdr } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Submission content is required' },
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

    // Submit the work
    const submissionId = await sorobanService.submitWork(
      senderPublicKey,
      id,
      content,
      signedXdr ? () => Promise.resolve(signedXdr) : mockSign
    );

    return NextResponse.json({ 
      id: submissionId,
      bountyId: id,
      applicant: senderPublicKey,
      content,
      created: new Date().toISOString(),
      status: 'PENDING'
    });
  } catch (error) {
    console.error(`Error submitting work for bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to submit work' },
      { status: 500 }
    );
  }
} 