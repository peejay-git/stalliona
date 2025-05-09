// lib/utils/initUserStore.ts
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from '@/lib/stores/useUserStore';

export function initUserStore() {
    const store = useUserStore.getState();
    store.setLoading(true);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const profile = docSnap.data();
                store.setUser({ uid: user.uid, ...profile.profileData, role: profile.role });
            } else {
                store.clearUser();
            }
        } else {
            store.clearUser();
        }
    });
}