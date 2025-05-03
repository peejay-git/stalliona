import { auth, db, storage } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function registerSponsor(data: any) {
    const { email, password, profileImageFile, companyLogoFile, ...rest } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const profileImageRef = ref(storage, `users/${uid}/profile.jpg`);
    const companyLogoRef = ref(storage, `users/${uid}/company-logo.jpg`);
    await uploadBytes(profileImageRef, profileImageFile);
    await uploadBytes(companyLogoRef, companyLogoFile);
    const profileUrl = await getDownloadURL(profileImageRef);
    const logoUrl = await getDownloadURL(companyLogoRef);

    await setDoc(doc(db, 'users', uid), {
        uid,
        role: 'sponsor',
        email,
        profileData: {
            ...rest,
            profileImage: profileUrl,
            companyLogo: logoUrl,
        },
    });
}

export async function registerTalent(data: any) {
    const { email, password, profileImageFile, ...rest } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const profileImageRef = ref(storage, `users/${uid}/profile.jpg`);
    await uploadBytes(profileImageRef, profileImageFile);
    const profileUrl = await getDownloadURL(profileImageRef);

    await setDoc(doc(db, 'users', uid), {
        uid,
        role: 'talent',
        email,
        profileData: {
            ...rest,
            profileImage: profileUrl,
        },
    });
}

export async function loginUser(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
}
