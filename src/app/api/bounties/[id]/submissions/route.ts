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
        content: 'I have completed this task by implementing the requested features. Added all the requested functionality including unit tests and documentation. The code is well-structured and follows all the best practices mentioned in the requirements.',
        created: '2023-05-15T10:30:00Z',
        status: 'PENDING',
        ranking: 1
      },
      {
        id: 'submission2',
        bountyId: id,
        applicant: 'GDFCYBELWTBX3EOAFRGOXPQO23YYHZ6XAKBCTTGP3MQKH3G6VNLRO3Q',
        content: 'Here is my implementation of the requested functionality. I\'ve taken a slightly different approach by optimizing for performance rather than readability. All tests pass and the code meets all the requirements specified in the bounty description.',
        created: '2023-05-16T14:45:00Z',
        status: 'PENDING',
        ranking: 2
      },
      {
        id: 'submission3',
        bountyId: id,
        applicant: 'GD5QWEVV4GZZTQP46BRXV5CUMMMLP4JTGFD7FWYJJWRL54CELY6JGQ63',
        content: 'I\'ve implemented the solution using a modern approach with well-documented code. The implementation is complete and includes additional features that weren\'t explicitly requested but add value to the project.',
        created: '2023-05-16T18:20:00Z',
        status: 'PENDING',
        ranking: 3
      },
      {
        id: 'submission4',
        bountyId: id,
        applicant: 'GB6YPGW5JFMMP2QB2USQ33EUWTXVL4ZT5ITUNCY3YKVWOJPP57CANOF3',
        content: 'My submission addresses all the requirements and includes comprehensive documentation. The code is clean, well-tested, and optimized for both performance and maintainability.',
        created: '2023-05-17T09:15:00Z',
        status: 'PENDING'
      },
      {
        id: 'submission5',
        bountyId: id,
        applicant: 'GDXF6SYWZM5XBGV6YVXWZCS7H4JVOVOZY4GVHTCL3DLFPJXFHKVEHWER',
        content: 'I\'ve implemented the solution with a focus on scalability. The code is modular, well-tested, and designed to handle increasing load. All requirements have been met, and I\'ve included additional optimizations.',
        created: '2023-05-17T11:30:00Z',
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