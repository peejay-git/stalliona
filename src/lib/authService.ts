import { FormDataType } from '@/components/RegisterModal';
import { auth, db, googleProvider } from './firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    signOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    UserCredential,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserStore } from './stores/useUserStore';

type TalentRegistrationData = Omit<FormDataType, 'confirmPassword' | 'profileImage'> & {
    profileImageFile?: File | null;
};

interface WalletData {
    address: string;
    publicKey: string;
    network: string;
}

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
        wallet: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
    });
    
    return userCredential;
}
// #endregion

// #region Talent Register Controller
export async function registerTalent(data: TalentRegistrationData) {
    const { email, password, profileImageFile, walletAddress, ...rest } = data;
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
        wallet: walletAddress ? {
            address: walletAddress,
            publicKey: walletAddress, // Use the actual Stellar public key
            network: 'TESTNET' // Use the actual network
        } : null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    });

    // Set Zustand store & localStorage
    const setUser = useUserStore.getState().setUser;
    const userProfile = {
        uid,
        username: rest.username,
        firstName: rest.firstName,
        role: 'talent',
        walletConnected: !!walletAddress
    };

    setUser(userProfile);
    localStorage.setItem('user', JSON.stringify(userProfile));
    
    return userCredential;
}
// #endregion

// #region Login Controller
export async function loginUser(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login timestamp
    const userRef = doc(db, 'users', userCredential.user.uid);
    await updateDoc(userRef, {
        lastLogin: new Date().toISOString()
    });
    
    return userCredential;
}
// #endregion

// #region Google Auth
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            // If user doesn't exist, create a new user doc
            const userData = {
                uid: user.uid,
                email: user.email,
                role: 'talent', // Default role
                profileData: {
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    username: user.email?.split('@')[0] || '',
                    profileImage: user.photoURL || '',
                },
                wallet: null,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                authProvider: 'google'
            };
            
            await setDoc(userRef, userData);
            
            const userProfile = {
                uid: user.uid,
                username: userData.profileData.username,
                firstName: userData.profileData.firstName,
                role: userData.role,
                walletConnected: false,
                profileImage: user.photoURL
            };
            
            useUserStore.getState().setUser(userProfile);
            localStorage.setItem('user', JSON.stringify(userProfile));
            
            return { user: result.user, isNewUser: true };
        } else {
            // User exists, update last login
            await updateDoc(userRef, {
                lastLogin: new Date().toISOString()
            });
            
            const userData = userDoc.data();
            const userProfile = {
                uid: user.uid,
                ...userData.profileData,
                role: userData.role,
                walletConnected: !!userData.wallet,
                profileImage: user.photoURL
            };
            
            useUserStore.getState().setUser(userProfile);
            localStorage.setItem('user', JSON.stringify(userProfile));
            
            return { user: result.user, isNewUser: false };
        }
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
}
// #endregion

// #region Wallet Connection
export async function connectWallet(walletData: WalletData) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not logged in');
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
        wallet: walletData
    });
    
    // Update user store
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
        const userData = userDoc.data();
        const userProfile = {
            uid: user.uid,
            ...userData.profileData,
            role: userData.role,
            walletConnected: true
        };
        
        useUserStore.getState().setUser(userProfile);
        localStorage.setItem('user', JSON.stringify(userProfile));
    }
    
    return walletData;
}

export async function updateUserWallet(walletData: WalletData) {
    return connectWallet(walletData);
}

export async function walletToAccount(walletAddress: string, userEmail: string) {
    // This function handles connecting a wallet to an existing account
    // or creating a new account if the user doesn't exist
    
    try {
        // Check if the wallet is already associated with an account
        const userRef = doc(db, 'users', walletAddress);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            // Wallet already has an account
            return { success: false, message: 'This wallet is already connected to an account' };
        }
        
        // Get user by email using Firestore v9 syntax
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            // No user with this email, could create a new account
            return { success: false, message: 'No account found with this email' };
        }
        
        const existingUserDoc = querySnapshot.docs[0];
        const existingUserData = existingUserDoc.data();
        
        // Check if the user already has a wallet
        if (existingUserData.wallet) {
            return { success: false, message: 'This account already has a wallet connected' };
        }
        
        // Update the user with wallet info
        await updateDoc(doc(db, 'users', existingUserDoc.id), {
            wallet: {
                address: walletAddress,
                publicKey: '', // Would be filled in with actual wallet public key
                network: '' // Would be filled with network info
            }
        });
        
        return { success: true, message: 'Wallet connected successfully' };
        
    } catch (error) {
        console.error('Error connecting wallet to account:', error);
        throw error;
    }
}
// #endregion

// #region Logout
export async function logoutUser() {
    await signOut(auth);
    useUserStore.getState().clearUser();
    
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    // Also clear wallet connection info to prevent "Complete Profile" button from showing
    localStorage.removeItem('stallionWalletType');
}
// #endregion

// #region Auth State Observer
export function initAuthStateObserver(callback: (user: any) => void) {
    return onAuthStateChanged(auth, async (authUser) => {
        if (authUser) {
            // User is signed in
            const userRef = doc(db, 'users', authUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userProfile = {
                    uid: authUser.uid,
                    ...userData.profileData,
                    email: authUser.email,
                    role: userData.role,
                    walletConnected: !!userData.wallet
                };
                callback(userProfile);
            } else {
                callback(null);
            }
        } else {
            // User is signed out
            callback(null);
        }
    });
}
// #endregion

// #region Forgot Password
export async function forgotPassword(email: string) {
    try {
        // Configure action code settings to specify the URL to redirect to after 
        // the password reset is complete
        const actionCodeSettings = {
            // URL you want to redirect back to after password reset
            url: `${window.location.origin}/auth/reset-success`,
            // This must be true for reset to work properly
            handleCodeInApp: true
        };

        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        return { success: true, message: 'Password reset email sent successfully' };
    } catch (error: any) {
        console.error('Error sending password reset email:', error);
        let errorMessage = 'Failed to send password reset email';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No user found with this email address';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format';
        }
        
        return { success: false, message: errorMessage };
    }
}
// #endregion
