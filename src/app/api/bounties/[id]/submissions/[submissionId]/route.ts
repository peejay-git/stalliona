import { NextRequest, NextResponse } from 'next/server';
import { BlockchainError } from '@/utils/error-handler';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

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

    console.log(`Fetching submission ${submissionId} for bounty ${id}`);

    // Fetch from the database instead of blockchain
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionSnap = await getDoc(submissionRef);

    if (!submissionSnap.exists()) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const data = submissionSnap.data();
    console.log(`Found submission data:`, data);

    // Format the submission data
    const submission = {
      id: submissionId,
      bountyId: parseInt(id),
      applicant: data.applicantAddress,
      content: data.content || '',
      details: data.content || '',
      links: data.links || '',
      created: data.createdAt || new Date().toISOString(),
      status: data.status || 'PENDING',
      ranking: data.ranking || null,
    };

    return NextResponse.json({ submission });
  } catch (error) {
    console.error(`Error fetching submission for bounty ${params.id}:`, error);
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
      console.log(`Ranking submission ${submissionId} as ${ranking}`);
      
      // Update the ranking in the database
      const submissionRef = doc(db, 'submissions', submissionId);
      const submissionSnap = await getDoc(submissionRef);
      
      if (!submissionSnap.exists()) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }
      
      // Update the ranking in the database
      await updateDoc(submissionRef, { 
        ranking: ranking,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Updated submission ${submissionId} ranking to ${ranking}`);
      
      // In a production app, we would also call the blockchain here
      // await sorobanService.selectWinners(
      //   Number(id),
      //   senderPublicKey,
      //   [submissionId]
      // );
      
      return NextResponse.json({
        success: true,
        message: 'Submission ranked successfully',
        id: submissionId,
        bountyId: id,
        ranking,
      });
    }

    // Handle accept action
    if (action === 'accept') {
      console.log(`Accepting submission ${submissionId}`);
      
      // Update the status in the database
      const submissionRef = doc(db, 'submissions', submissionId);
      const submissionSnap = await getDoc(submissionRef);
      
      if (!submissionSnap.exists()) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }
      
      // Update the status in the database
      await updateDoc(submissionRef, { 
        status: 'ACCEPTED',
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Updated submission ${submissionId} status to ACCEPTED`);
      
      return NextResponse.json({
        success: true,
        message: 'Submission accepted successfully',
        id: submissionId,
        bountyId: id,
        status: 'ACCEPTED',
      });
    }
    
    return NextResponse.json(
      { error: 'Valid action (accept or rank) is required' },
      { status: 400 }
    );
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
