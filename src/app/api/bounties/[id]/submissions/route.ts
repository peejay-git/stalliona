import { BountyService } from '@/lib/bountyService';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bounties/[id]/submissions
 * Get submissions for a bounty
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 },
      );
    }

    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 },
      );
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if the user is a sponsor
    const userRole = request.headers.get('x-user-role');
    const isSponsor = userRole === 'sponsor';

    // Create bounty service
    const bountyService = new BountyService();

    // First get the bounty to check ownership
    let bounty;
    try {
      bounty = await bountyService.getBountyById(id);
    } catch (error) {
      console.error(`Error fetching bounty ${id}:`, error);

      // If user is a sponsor, we can bypass the blockchain check or try just DB
      // But bountyService.getBountyById should handle fallback mostly.
      // If it fails, we check DB directly as fallback (Upstream logic)
      if (isSponsor) {
        const docRef = doc(db, 'bounties', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          return NextResponse.json(
            { error: 'Bounty not found in database' },
            { status: 404 },
          );
        }

        bounty = {
          id: parseInt(id),
          ...docSnap.data(),
          owner: docSnap.data().owner || '',
          sponsorName: docSnap.data().sponsorName || '',
        };
      } else {
        return NextResponse.json(
          { error: 'Failed to get bounty', code: 'CONTRACT_ERROR' },
          { status: 400 },
        );
      }
    }

    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }

    // Get the user ID from the token (Assuming token is UID or Wallet Address depending on auth flow)
    const userId = token;
    const isOwner = bounty.owner === userId;

    // Allow access if user is either the owner or a sponsor
    if (!isOwner && !isSponsor) {
      return NextResponse.json(
        { error: 'You are not authorized to view submissions for this bounty' },
        { status: 403 },
      );
    }

    // Get all submissions for the bounty using the service (Clean Stashed logic)
    try {
      const submissions = await bountyService.getBountySubmissions(id);
      return NextResponse.json(submissions);
    } catch (error) {
      console.error(`Error fetching submissions for bounty ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions from database' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error(`Error fetching submissions for bounty ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/bounties/[id]/submissions
 * Save submission data to the database
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: bountyId } = params;
    if (!bountyId) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 },
      );
    }

    // Parse the request body
    const { applicantAddress, userId, content, links, blockchainSubmissionId } =
      await request.json();

    // Validate required fields
    if (!applicantAddress || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Additional validation for applicantAddress
    if (
      typeof applicantAddress !== 'string' ||
      applicantAddress.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'Invalid applicant address format' },
        { status: 400 },
      );
    }

    // Create bounty service
    const bountyService = new BountyService();

    // Check if the bounty has expired or duplicate submission
    try {
      // Check for duplicates first
      const existingSubmissions =
        await bountyService.getBountySubmissions(bountyId);
      const hasSubmitted = existingSubmissions.some(
        (submission) =>
          submission.applicant === applicantAddress ||
          (userId && submission.userId === userId),
      );

      if (hasSubmitted) {
        return NextResponse.json(
          { error: 'You have already submitted work for this bounty' },
          { status: 400 },
        );
      }

      // Check Expiry/Status
      const bountyRef = doc(db, 'bounties', bountyId);
      const bountySnap = await getDoc(bountyRef);

      if (!bountySnap.exists()) {
        return NextResponse.json(
          { error: 'Bounty not found' },
          { status: 404 },
        );
      }

      const bountyData = bountySnap.data();

      if (bountyData.status === 'COMPLETED') {
        return NextResponse.json(
          {
            error:
              'This bounty has been completed and is no longer accepting submissions',
          },
          { status: 400 },
        );
      }

      const deadline = bountyData.deadline || bountyData.submissionDeadline;

      if (deadline) {
        const deadlineDate = new Date(deadline);
        const now = new Date();

        if (now > deadlineDate) {
          // Update bounty status to COMPLETED
          try {
            await updateDoc(bountyRef, {
              status: 'COMPLETED',
              updatedAt: new Date().toISOString(),
            });
            console.log(
              'Updated bounty status to COMPLETED due to passed deadline',
            );
          } catch (updateError) {
            console.error('Error updating bounty status:', updateError);
          }

          return NextResponse.json(
            {
              error:
                'This bounty has been completed and is no longer accepting submissions',
            },
            { status: 400 },
          );
        }
      }
    } catch (error) {
      console.error('Error checking bounty status:', error);
      return NextResponse.json(
        { error: 'Failed to check bounty status' },
        { status: 500 },
      );
    }

    // Save submission to database with additional userId field
    // Use blockchainSubmissionId if available (Upstream), otherwise define one (or fallback)
    // The SubmitWorkForm sends 'blockchainSubmissionId'.
    const submissionId =
      blockchainSubmissionId ||
      `submission_${Date.now()}_${applicantAddress.slice(0, 8)}`;

    await bountyService.saveSubmissionToDatabase(
      parseInt(bountyId),
      applicantAddress,
      content,
      submissionId,
      links,
      userId,
    );

    return NextResponse.json({
      success: true,
      message: 'Submission saved successfully',
      id: submissionId,
    });
  } catch (error: any) {
    console.error(`Error submitting to bounty ${params.id}:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
