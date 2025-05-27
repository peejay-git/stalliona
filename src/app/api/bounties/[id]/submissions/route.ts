import { SorobanService } from '@/lib/soroban';
import { BlockchainError } from '@/utils/error-handler';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the Soroban service
// TODO: Pass in the publicKey of the currently signed in user
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

    // TODO: Fetch these from the database instead
    const submissions = await sorobanService.getBountySubmissions(Number(id));

    return NextResponse.json({ submissions });
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

    // Apply to bounty
    await sorobanService.applyToBounty(senderPublicKey, Number(id), content);

    // TODO: Save to database

    return NextResponse.json({
      bountyId: id,
      applicant: senderPublicKey,
      content,
      created: new Date().toISOString(),
      status: 'PENDING',
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
