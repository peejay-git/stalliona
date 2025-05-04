import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

export async function saveBounty(bounty: any) {
    const bountyRef = collection(db, 'bounties');
    const doc = await addDoc(bountyRef, {
        ...bounty,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return doc.id;
}


export async function getAllBounties() {
    const q = query(collection(db, 'bounties'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}


export async function getBountyById(id: string) {
    const docRef = doc(db, 'bounties', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    return {
        id: docSnap.id,
        ...docSnap.data(),
    };
}