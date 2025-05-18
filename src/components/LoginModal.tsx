'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { IoClose } from 'react-icons/io5';
import { FiMail, FiLock } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { SiBlockchaindotcom } from 'react-icons/si';
import { loginUser, signInWithGoogle, walletToAccount } from '@/lib/authService';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from '@/lib/stores/useUserStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import WalletSelector from './WalletSelector';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToRegister?: () => void;
};

type LoginView = 'main' | 'wallet-selector' | 'wallet-email';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: Props) {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
    const [isWalletSubmitting, setIsWalletSubmitting] = useState(false);
    const [walletEmail, setWalletEmail] = useState('');
    const [currentView, setCurrentView] = useState<LoginView>('main');
    const [animationComplete, setAnimationComplete] = useState(false);
    const { connect: connectWallet, isConnected, publicKey, disconnect, walletType } = useWallet();

    useEffect(() => {
        if (isOpen) {
            setAnimationComplete(true);
        } else {
            setAnimationComplete(false);
            // Reset view when closing modal
            setCurrentView('main');
        }
    }, [isOpen]);

    const validateField = (name: string, value: string) => {
        switch (name) {
            case 'email':
                return !value ? 'Email is required.' : '';
            case 'password':
                return !value ? 'Password is required.' : '';
            default:
                return '';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({ ...prev, [name]: value }));

        const errorMsg = validateField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));

        if (formError) setFormError(null); // Clear global error on typing
    };

    const handleGoogleSignIn = async () => {
        try {
            setIsGoogleSubmitting(true);
            const { user, isNewUser } = await signInWithGoogle();
            
            toast.success('Login successful!');
            onClose();
            
            if (isNewUser) {
                // If it's a new user, prompt them to connect their wallet
                router.push('/connect-wallet');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            toast.error('Google sign-in failed. Please try again.');
        } finally {
            setIsGoogleSubmitting(false);
        }
    };

    const handleWalletConnect = () => {
        setCurrentView('wallet-selector');
    };

    const handleWalletSelected = (walletType: string, publicKey: string) => {
        if (publicKey) {
            setCurrentView('wallet-email');
        }
    };

    const handleWalletLogin = async () => {
        if (!publicKey) {
            toast.error('Wallet not connected. Please connect your wallet first.');
            return;
        }

        if (!walletEmail) {
            toast.error('Please enter your email address.');
            return;
        }

        try {
            setIsWalletSubmitting(true);
            
            // Try to link wallet to account or login
            const result = await walletToAccount(publicKey, walletEmail);
            
            if (result.success) {
                toast.success('Login successful!');
                onClose();
                router.push('/dashboard');
            } else {
                // Account not found, prompt to create one
                toast.error(result.message || 'Account not found. Please register first.');
                disconnect();
                onClose();
                onSwitchToRegister?.();
            }
        } catch (err) {
            console.error(err);
            toast.error('Wallet login failed. Please try again.');
        } finally {
            setIsWalletSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailError = validateField('email', formData.email);
        const passwordError = validateField('password', formData.password);

        setFieldErrors({ email: emailError, password: passwordError });
        if (emailError || passwordError) return;

        setIsSubmitting(true);

        try {
            const userCredential = await loginUser(formData.email, formData.password);
            const uid = userCredential.user.uid;

            const docRef = doc(db, 'users', uid);
            const userSnap = await getDoc(docRef);

            if (!userSnap.exists()) {
                throw new Error('User profile not found.');
            }

            const userData = userSnap.data();

            if (!userData?.role || !userData?.profileData) {
                throw new Error('Incomplete user profile.');
            }

            const userProfile = {
                uid,
                role: userData.role,
                walletConnected: !!userData.wallet,
                ...userData.profileData,
            };

            // 1. Store in Zustand
            useUserStore.getState().setUser(userProfile);

            // 2. Store in localStorage
            localStorage.setItem('user', JSON.stringify(userProfile));

            toast.success('Login successful!');
            onClose();

            // Check if wallet needs to be connected
            if (!userData.wallet) {
                router.push('/connect-wallet');
            } else {
                // Always redirect to /dashboard regardless of role
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);

            // Handle Firebase-specific errors
            if (err.code) {
                switch (err.code) {
                    case 'auth/user-not-found':
                        toast.error('No user found with this email. Please check your email address.');
                        break;
                    case 'auth/wrong-password':
                        toast.error('Incorrect password. Please try again.');
                        break;
                    case 'auth/too-many-requests':
                        toast.error('Too many attempts. Please try again later.');
                        break;
                    case 'auth/network-request-failed':
                        toast.error('Network error. Please check your internet connection.');
                        break;
                    case 'auth/invalid-email':
                        toast.error('Invalid email format. Please provide a valid email address.');
                        break;
                    default:
                        toast.error('Login failed. Please check your credentials.');
                        break;
                }
            } else {
                toast.error(err.message || 'Login failed. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Wallet login email view content
    const renderWalletEmailContent = () => {
        return (
            <div className="space-y-6">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-300 text-center"
                >
                    {walletType && publicKey ? 
                        `Connected to ${walletType.toUpperCase()}: ${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 6)}` 
                        : 'Enter your email to continue'}
                </motion.p>
                
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <input
                        type="email"
                        placeholder="Your email address"
                        value={walletEmail}
                        onChange={(e) => setWalletEmail(e.target.value)}
                        className="input w-full"
                    />
                </motion.div>
                
                <motion.div
                    className="flex gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <button
                        onClick={() => setCurrentView('wallet-selector')}
                        className="bg-white/10 text-white font-medium py-3 px-4 rounded-lg hover:bg-white/20 transition-colors flex-1"
                    >
                        Back
                    </button>
                    
                    <motion.button
                        onClick={handleWalletLogin}
                        disabled={isWalletSubmitting}
                        className="bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-white/90 transition-colors flex-1"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isWalletSubmitting ? (
                            <span className="flex gap-2 items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
                            </span>
                        ) : (
                            'Continue'
                        )}
                    </motion.button>
                </motion.div>
            </div>
        );
    };
    
    // Main content
    const renderMainContent = () => (
        <>
            <motion.button
                onClick={handleWalletConnect}
                disabled={isWalletSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-black/40 text-white py-3 px-4 rounded-lg mb-6 hover:bg-black/60 transition-colors border border-white/10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
            >
                <SiBlockchaindotcom className="w-5 h-5" />
                Connect Wallet
            </motion.button>

            <div className="relative flex items-center justify-center mb-6">
                <div className="absolute left-0 w-full border-t border-white/10"></div>
                <div className="relative bg-[#070708] px-4 text-sm text-gray-300">or</div>
            </div>

            <form onSubmit={handleSubmit}>
                <motion.div 
                    className="mb-6"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" />
                        <input
                            name="email"
                            type="email"
                            placeholder="Email"
                            className="input w-full pl-10 transition-all border-white/20 bg-white/10 backdrop-blur-xl text-white"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    {fieldErrors.email && (
                        <p className="text-sm text-red-300 mt-1">{fieldErrors.email}</p>
                    )}
                </motion.div>

                <motion.div 
                    className="mb-8"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" />
                        <input
                            name="password"
                            type="password"
                            placeholder="Password"
                            className="input w-full pl-10 transition-all border-white/20 bg-white/10 backdrop-blur-xl text-white"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    {fieldErrors.password && (
                        <p className="text-sm text-red-300 mt-1">{fieldErrors.password}</p>
                    )}
                </motion.div>

                <motion.button
                    type="submit"
                    className="bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-white/90 transition-colors w-full"
                    disabled={isSubmitting}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isSubmitting ? (
                        <span className="flex gap-2 items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
                        </span>
                    ) : (
                        'Sign In'
                    )}
                </motion.button>
            </form>

            <div className="mt-6 relative flex items-center justify-center">
                <div className="absolute left-0 w-full border-t border-white/10"></div>
                <div className="relative bg-[#070708] px-4 text-sm text-gray-300">or continue with</div>
            </div>
            
            <motion.button
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting}
                className="mt-6 w-full flex items-center justify-center gap-2 border border-white/20 bg-white/10 hover:bg-white/15 text-white py-3 px-4 rounded-lg transition-colors"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
            >
                {isGoogleSubmitting ? (
                    <span className="flex gap-2 items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 rounded-full bg-white animate-bounce"></span>
                    </span>
                ) : (
                    <>
                        <FcGoogle className="w-5 h-5" />
                        <span>Google</span>
                    </>
                )}
            </motion.button>

            <motion.div 
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <p className="text-gray-300">
                    Don't have an account?{' '}
                    <button
                        onClick={() => {
                            onClose();
                            onSwitchToRegister?.();
                        }}
                        className="text-white hover:underline font-medium"
                    >
                        Register
                    </button>
                </p>
            </motion.div>
        </>
    );
    
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-md mx-auto z-[9999] max-h-[90vh]"
                    >
                        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                            <div className="relative p-8 overflow-y-auto max-h-[80vh]">
                                <motion.button
                                    whileHover={{ rotate: 90 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                                    onClick={onClose}
                                >
                                    <IoClose className="w-6 h-6" />
                                </motion.button>

                                <motion.div 
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h2 className="text-3xl font-bold mb-2 text-white text-center">
                                        {currentView === 'main' ? 'Welcome Back' : 
                                         currentView === 'wallet-selector' ? 'Select Wallet' : 
                                         'Link Your Account'}
                                    </h2>
                                    <p className="text-gray-300 text-center mb-8">
                                        {currentView === 'main' ? 'Sign in to your account' :
                                         currentView === 'wallet-selector' ? 'Choose your preferred wallet' :
                                         'Enter your email to continue'}
                                    </p>
                                </motion.div>

                                {formError && currentView === 'main' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-900/20 text-red-300 border border-red-700/30 p-4 rounded-lg mb-6 text-sm"
                                    >
                                        {formError}
                                    </motion.div>
                                )}

                                <AnimatePresence mode="wait">
                                    {currentView === 'main' && renderMainContent()}
                                    
                                    {currentView === 'wallet-selector' && (
                                        <motion.div
                                            key="wallet-selector"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <WalletSelector 
                                                onConnect={handleWalletSelected}
                                                onBack={() => setCurrentView('main')}
                                                loading={isWalletSubmitting}
                                            />
                                        </motion.div>
                                    )}
                                    
                                    {currentView === 'wallet-email' && (
                                        <motion.div
                                            key="wallet-email"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            {renderWalletEmailContent()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
