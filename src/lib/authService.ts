import { FormDataType } from '@/components/RegisterModal';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserStore } from './stores/useUserStore';
type TalentRegistrationData = Omit<FormDataType, 'confirmPassword' | 'profileImage'> & {
    profileImageFile?: File | null;
};

// #region Sponsor Register Controller
export async function registerSponsor(data: any) {
    const { email, password, profileImageFile, companyLogoFile, ...rest } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // const profileImageRef = ref(storage, `users/${uid}/profile.jpg`);
    // const companyLogoRef = ref(storage, `users/${uid}/company-logo.jpg`);
    // await uploadBytes(profileImageRef, profileImageFile);
    // await uploadBytes(companyLogoRef, companyLogoFile);
    // const profileUrl = await getDownloadURL(profileImageRef);
    // const logoUrl = await getDownloadURL(companyLogoRef);

    await setDoc(doc(db, 'users', uid), {
        uid,
        role: 'sponsor',
        email,
        profileData: {
            ...rest,
            // profileImage: profileUrl,
            // companyLogo: logoUrl,
        },
    });
}
// #endregion

// #region Talent Register Controller
export async function registerTalent(data: TalentRegistrationData) {
    const { email, password, profileImageFile, ...rest } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    // let profileUrl = '';

    // if (profileImageFile) {
    //     const profileImageRef = ref(storage, `users/${uid}/profile.jpg`);
    //     await uploadBytes(profileImageRef, profileImageFile);
    //     profileUrl = await getDownloadURL(profileImageRef);
    // }

    // Save user data to Firestore
    await setDoc(doc(db, 'users', uid), {
        uid,
        role: 'talent',
        email,
        profileData: {
            ...rest,

        },
    });

    // Set Zustand store & localStorage
    const setUser = useUserStore.getState().setUser;
    const userProfile = {
        uid,
        username: rest.username,
        firstName: rest.firstName,
        role: 'talent',
    };

    setUser(userProfile);
    localStorage.setItem('user', JSON.stringify(userProfile));
}
// #endregion

// #region Login Controller
export async function loginUser(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
}
// #endregion
