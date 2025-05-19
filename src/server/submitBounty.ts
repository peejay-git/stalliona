// src/server/submitBounty.ts
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendMail } from '@/server/sendEmail';
import { SubmitBountyInput } from '@/lib/bounties';

export async function submitBounty({ bountyId, userId, submissionData }: SubmitBountyInput): Promise<string> {
    const bountyRef = doc(db, 'bounties', bountyId);
    const bountySnap = await getDoc(bountyRef);

    if (!bountySnap.exists()) throw new Error('Bounty not found');

    const bounty = bountySnap.data();
    const sponsorId = bounty.owner;

    if (sponsorId === userId) {
        throw new Error("You cannot submit work to your own bounty.");
    }

    const deadlineDate = new Date(bounty.deadline);
    if (new Date() > deadlineDate) {
        throw new Error("The submission deadline for this bounty has passed.");
    }

    const submissionsRef = collection(db, 'submissions');
    const q = query(submissionsRef, where('bountyId', '==', bountyId), where('userId', '==', userId));
    const existing = await getDocs(q);

    if (!existing.empty) {
        throw new Error("You have already submitted work for this bounty.");
    }

    const docRef = await addDoc(submissionsRef, {
        bountyId,
        userId,
        ...submissionData,
        submittedAt: serverTimestamp(),
        status: 'PENDING',
    });

    const sponsorSnap = await getDoc(doc(db, 'users', sponsorId));
    const talentSnap = await getDoc(doc(db, 'users', userId));

    if (!sponsorSnap.exists() || !talentSnap.exists()) return docRef.id;

    const sponsorEmail = sponsorSnap.data().email;
    const talentEmail = talentSnap.data().email;
    const talentFirstName = talentSnap.data().firstName || 'Talent';

    await sendMail(talentEmail, sponsorEmail, talentFirstName);

    return docRef.id;
}
