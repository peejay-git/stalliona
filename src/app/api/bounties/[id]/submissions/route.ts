import { NextRequest, NextResponse } from 'next/server';
import { BlockchainError } from '@/utils/error-handler';
import { BountyService } from '@/lib/bountyService';
import { auth } from '@/lib/firebase';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
    console.log(`API: Getting submissions for bounty ID ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if the user is a sponsor
    const userRole = request.headers.get('x-user-role');
    const isSponsor = userRole === 'sponsor';
    
    console.log('API Authorization check:', {
      token,
      userRole,
      isSponsor
    });

    // Create bounty service
    const bountyService = new BountyService();
    
    // First get the bounty to check ownership
    let bounty;
    try {
      bounty = await bountyService.getBountyById(id);
    } catch (error) {
      console.error(`Error fetching bounty ${id}:`, error);
      
      // If user is a sponsor, we can bypass the blockchain check
      if (isSponsor) {
        console.log('User is a sponsor, bypassing blockchain check');
        // Get bounty from database only
        const docRef = doc(db, 'bounties', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          return NextResponse.json(
            { error: 'Bounty not found in database' },
            { status: 404 }
          );
        }
        
        bounty = {
          id: parseInt(id),
          ...docSnap.data(),
          owner: docSnap.data().owner || '',
          sponsorName: docSnap.data().sponsorName || ''
        };
      } else {
        // If not a sponsor, return the error
        return NextResponse.json(
          { error: 'Failed to get bounty', code: 'CONTRACT_ERROR' },
          { status: 400 }
        );
      }
    }
    
    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    // Get the user ID from the token
    const userId = token;
    
    console.log('Authorization check:', {
      userId,
      bountyOwner: bounty.owner,
      isOwner: bounty.owner === userId,
      isSponsor,
      sponsorName: bounty.sponsorName || 'No sponsor'
    });
    
    // Check if the user is the bounty owner or a sponsor
    const isOwner = bounty.owner === userId;
    
    // Allow access if user is either the owner or a sponsor
    if (!isOwner && !isSponsor) {
      return NextResponse.json(
        { error: 'You are not authorized to view submissions for this bounty' },
        { status: 403 }
      );
    }

    // Get all submissions for the bounty (from database only)
    try {
      // Get off-chain submission data from the database
      const submissionsRef = collection(db, 'submissions');
      const q = query(
        submissionsRef,
        where('bountyId', '==', id.toString())
      );
      const snapshot = await getDocs(q);

      // If there are no submissions, return empty array
      if (snapshot.empty) {
        return NextResponse.json([]);
      }

      console.log(`Found ${snapshot.docs.length} submissions for bounty ${id}`);

      // Map the submissions from the database
      const submissions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          bountyId: parseInt(id),
          applicant: data.applicantAddress || 'Unknown',
          walletAddress: data.applicantAddress || 'Unknown',
          userId: data.userId || null,
          submission: data.links || '',
          content: data.content || '',
          details: data.content || '',
          links: data.links || '',
          created: data.createdAt || new Date().toISOString(),
          status: data.status || 'PENDING',
          ranking: data.ranking || null,
        };
      });

    return NextResponse.json(submissions);
    } catch (error) {
      console.error(`Error fetching submissions for bounty ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions from database' },
        { status: 500 }
      );
    }
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
 * Save submission data to the database (no blockchain interaction)
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
      userId,
      content, 
      links,
      blockchainSubmissionId 
    } = await request.json();

    // Validate required fields
    if (!applicantAddress || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the full request data for debugging
    console.log('DEBUG: Submission data received:', {
      bountyId,
      applicantAddress,
      userId,
      content: content.substring(0, 50) + '...',
      links,
      blockchainSubmissionId
    });

    // Additional validation for applicantAddress
    if (typeof applicantAddress !== 'string' || applicantAddress.trim() === '') {
      console.error('ERROR: Invalid applicantAddress format:', applicantAddress);
      return NextResponse.json(
        { error: 'Invalid applicant address format' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService();
    
    // Check if the bounty has expired
    try {
      const bountyRef = doc(db, 'bounties', bountyId);
      const bountySnap = await getDoc(bountyRef);
      
      if (!bountySnap.exists()) {
        return NextResponse.json(
          { error: 'Bounty not found' },
          { status: 404 }
        );
      }
      
      const bountyData = bountySnap.data();
      
      // Check if bounty is already marked as COMPLETED
      if (bountyData.status === 'COMPLETED') {
        return NextResponse.json(
          { error: 'This bounty has been completed and is no longer accepting submissions' },
          { status: 400 }
        );
      }
      
      // Check if deadline has passed
      const deadline = bountyData.deadline || bountyData.submissionDeadline;
      
      if (deadline) {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        
        if (now > deadlineDate) {
          // Update bounty status to COMPLETED
          try {
            await updateDoc(bountyRef, {
              status: 'COMPLETED',
              updatedAt: new Date().toISOString()
            });
            console.log('Updated bounty status to COMPLETED due to passed deadline');
          } catch (updateError) {
            console.error('Error updating bounty status:', updateError);
          }
          
          return NextResponse.json(
            { error: 'This bounty has been completed and is no longer accepting submissions' },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      console.error('Error checking bounty status:', error);
      return NextResponse.json(
        { error: 'Failed to check bounty status' },
        { status: 500 }
      );
    }
    
    // Save submission to database with additional userId field
    await bountyService.saveSubmissionToDatabase(
      parseInt(bountyId),
      applicantAddress,
      content,
      blockchainSubmissionId,
      links,
      userId
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
