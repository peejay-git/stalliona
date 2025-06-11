import { NextRequest, NextResponse } from 'next/server';
import { BlockchainError } from '@/utils/error-handler';
import { BountyService } from '@/lib/bountyService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bounties/[id]/submissions
 * Get submissions for a bounty
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
    
    // Get all submissions for the bounty (combines blockchain and database data)
    const submissions = await bountyService.getBountySubmissions(id);

    return NextResponse.json(submissions);
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
 * This is called AFTER the blockchain submission
 * Saves the off-chain submission data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: bountyId } = params;
    if (!bountyId) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const { 
      applicantAddress, 
      content, 
      blockchainSubmissionId 
    } = await request.json();

    // Validate required fields
    if (!applicantAddress || !content || !blockchainSubmissionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService();
    
    // Save submission to database
    await bountyService.saveSubmissionToDatabase(
      parseInt(bountyId),
      applicantAddress,
      content,
      blockchainSubmissionId
    );

    return NextResponse.json({
      success: true,
      message: 'Submission saved successfully',
      id: blockchainSubmissionId,
    });
  } catch (error) {
    console.error(`Error submitting to bounty ${params.id}:`, error);
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
