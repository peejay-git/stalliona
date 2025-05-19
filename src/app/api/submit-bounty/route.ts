// app/api/submit-bounty/route.ts
import { submitBounty } from '@/server/submitBounty';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { bountyId, userId, submissionData } = body;

        const submissionId = await submitBounty({ bountyId, userId, submissionData });

        return NextResponse.json({ success: true, submissionId });
    } catch (error: any) {
        console.error('❌ submitBounty API error:', error);
        return NextResponse.json(
            { error: error.message || 'Submission failed' },
            { status: 500 }
        );
    }
}
