'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { IoClose } from 'react-icons/io5';
import { loginUser } from '@/lib/authService';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToRegister?: () => void;
};

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: Props) {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const userData = userSnap.data();

            if (!userSnap.exists() || !userData?.role) {
                throw new Error('No role found for this user.');
            }

            const role = userData.role;
            onClose();

            if (role === 'sponsor') router.push('/dashboard/sponsor');
            else if (role === 'talent') router.push('/dashboard/talent');
            else router.push('/dashboard');
        } catch (err) {
            console.error(err);
            setFormError('Login failed. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className={clsx(
                'fixed inset-0 z-50 flex items-center justify-center transition-all duration-300',
                isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
            )}
        >
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6 z-10">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
                    aria-label="Close"
                >
                    <IoClose className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

                {formError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
                        {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <input
                            name="email"
                            type="email"
                            placeholder="Email"
                            className="input w-full"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {fieldErrors.email && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div className="mb-6">
                        <input
                            name="password"
                            type="password"
                            placeholder="Password"
                            className="input w-full"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        {fieldErrors.password && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full py-2 flex items-center justify-center"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex gap-1 h-[30px] items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 rounded-full bg-white animate-bounce"></span>
                            </span>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                    Don’t have an account?{' '}
                    <button
                        onClick={() => {
                            onClose();
                            onSwitchToRegister?.();
                        }}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Register
                    </button>
                </div>
            </div>
        </div>
    );
}
