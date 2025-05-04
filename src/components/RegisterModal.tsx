'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { IoClose } from 'react-icons/io5';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { registerTalent } from '@/lib/authService';
import toast from 'react-hot-toast';
import { FirebaseError } from 'firebase/app';
import { useUserStore } from '@/lib/stores/useUserStore';
import { auth } from '@/lib/firebase';

const defaultSkills = ['Frontend', 'Backend', 'UI/UX Design', 'Writing', 'Digital Marketing'];

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export type FormDataType = {
    firstName: string;
    lastName: string;
    username: string;
    location: string;
    skills: string[];
    socials: SocialLink[];
    profileImage: File | null;
    email: string;
    password: string;
    confirmPassword: string;
};

type SocialPlatform = 'twitter' | 'github' | 'linkedin';

type SocialLink = {
    platform: SocialPlatform;
    username: string;
};
type FieldErrors = Partial<Record<keyof FormDataType, string>>;

export default function RegisterModal({ isOpen, onClose }: Props) {
    const router = useRouter();
    const [hasEditedUsername, setHasEditedUsername] = useState(false);

    const [formData, setFormData] = useState<FormDataType>({
        firstName: '',
        lastName: '',
        username: '',
        location: '',
        skills: [],
        socials: [{ platform: 'twitter', username: '' }],
        profileImage: null,
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = (name: keyof FormDataType, value: any) => {
        let error = '';
        if ((name === 'firstName' || name === 'lastName' || name === 'username') && !value.trim()) {
            error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
        }
        if (name === 'skills' && value.length === 0) {
            error = 'Please select at least one skill.';
        }
        setFieldErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            return updated;
        });

        if (name === 'username') {
            setHasEditedUsername(true);
        }

        validateField(name as keyof FormDataType, value);
    };

    const handleSkillToggle = (skill: string) => {
        setFormData((prev) => {
            const updatedSkills = prev.skills.includes(skill)
                ? prev.skills.filter((s) => s !== skill)
                : [...prev.skills, skill];
            validateField('skills', updatedSkills);
            return { ...prev, skills: updatedSkills };
        });
    };

    const handleAddSocial = () => {
        const platforms: SocialPlatform[] = ['twitter', 'github', 'linkedin'];
        const used = formData.socials.map((s) => s.platform);
        const next = platforms.find((p) => !used.includes(p));
        if (!next) return; // All platforms already added
        setFormData((prev) => ({
            ...prev,
            socials: [...prev.socials, { platform: next, username: '' }],
        }));
    };


    const handleSocialChange = (
        index: number,
        field: 'platform' | 'username',
        value: string
    ) => {
        const updated = [...formData.socials];
        if (field === 'platform') {
            updated[index].platform = value as SocialPlatform;
        } else {
            updated[index].username = value;
        }
        setFormData((prev) => ({ ...prev, socials: updated }));
    };


    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'twitter':
                return <FaXTwitter className="text-gray-500 text-xl" />;
            case 'github':
                return <FaGithub className="text-gray-500 text-xl" />;
            case 'linkedin':
                return <FaLinkedin className="text-gray-500 text-xl" />;
            default:
                return null;
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file && file.size <= 5 * 1024 * 1024) {
            setFormData((prev) => ({ ...prev, profileImage: file }));
        } else {
            alert('Image must be under 5MB.');
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errors: FieldErrors = {};
        if (!formData.firstName.trim()) errors.firstName = 'First Name is required.';
        if (!formData.lastName.trim()) errors.lastName = 'Last Name is required.';
        if (!formData.username.trim()) errors.username = 'Username is required.';
        if (formData.skills.length === 0) errors.skills = 'Please select at least one skill.';
        if (!formData.email.trim()) errors.email = 'Email is required.';
        if (!formData.password) errors.password = 'Password is required.';
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }

        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setIsSubmitting(true);
        try {
            await registerTalent({
                email: formData.email,
                password: formData.password,
                // profileImageFile: formData.profileImage,
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                location: formData.location,
                skills: formData.skills,
                socials: formData.socials.filter(s => s.username.trim() !== ''),
            });
            const userProfile = {
                uid: auth.currentUser?.uid || '', // fallback
                username: formData.username,
                firstName: formData.firstName,
                role: 'talent',
                // Add any other field you want to store
            }
            useUserStore.getState().setUser(userProfile);
            localStorage.setItem('user', JSON.stringify(userProfile));
            toast.success('Profile created successfully!');
            onClose();
            router.push('/dashboard');

            // onClose();
            // router.push('/dashboard/talent');
        } catch (error: any) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        toast.error('Email already in use. Please use another.');
                        break;
                    case 'auth/invalid-email':
                        toast.error('Invalid email address.');
                        break;
                    case 'auth/weak-password':
                        toast.error('Password should be at least 6 characters.');
                        break;
                    default:
                        toast.error(error.message || 'An unexpected error occurred.');
                }
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={clsx(
            'fixed inset-0 z-50 flex items-center justify-center transition-all duration-300',
            isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        )}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl shadow-2xl z-10 bg-transparent">

                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition outline-none" aria-label="Close">
                    <IoClose className="w-6 h-6" />
                </button>
                <div className="rounded-2xl overflow-hidden ">
                    <div className="max-h-[90vh] overflow-y-auto bg-white p-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">

                        <h2 className="text-2xl font-bold mb-2 text-center">Complete your Profile</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            We’ll tailor your Earn experience based on your profile
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center justify-center mb-6">
                                <label htmlFor="profile-upload" className="cursor-pointer group">
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-400 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center">
                                        {formData.profileImage ? (
                                            <img src={URL.createObjectURL(formData.profileImage)} alt="Preview" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <svg className="w-6 h-6 text-indigo-500 group-hover:text-indigo-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" />
                                            </svg>
                                        )}
                                    </div>
                                    <input id="profile-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    <p className="text-xs text-gray-500 mt-1 text-center">Upload Photo</p>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <input name="firstName" placeholder="First Name" className="input" value={formData.firstName} onChange={handleChange} />
                                    {fieldErrors.firstName && <p className="text-red-500 text-sm mt-1">{fieldErrors.firstName}</p>}
                                </div>
                                <div>
                                    <input name="lastName" placeholder="Last Name" className="input" value={formData.lastName} onChange={handleChange} />
                                    {fieldErrors.lastName && <p className="text-red-500 text-sm mt-1">{fieldErrors.lastName}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {/* Username Field */}
                                <div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                                        <input
                                            name="username"
                                            className="input pl-8"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="Username"
                                        />
                                    </div>
                                    {fieldErrors.username && (
                                        <p className="text-red-500 text-sm mt-1">{fieldErrors.username}</p>
                                    )}
                                </div>

                                {/* Location Field */}
                                <div>
                                    <input
                                        name="location"
                                        placeholder="Location (e.g. Lagos, NG)"
                                        className="input"
                                        value={formData.location}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <div>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        className="input"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
                                </div>

                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        className="input"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
                                </div>
                                <div >
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Confirm Password"
                                        className="input"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>}
                                </div>

                            </div>



                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-medium text-gray-700">Your Skills *</label>
                                <div className="flex flex-wrap gap-2">
                                    {defaultSkills.map((skill) => (
                                        <button
                                            key={skill}
                                            type="button"
                                            onClick={() => handleSkillToggle(skill)}
                                            className={clsx(
                                                'text-sm px-3 py-1 rounded-full border transition',
                                                formData.skills.includes(skill)
                                                    ? 'bg-blue-100 text-blue-600 border-blue-300'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                                            )}
                                        >
                                            {skill} +
                                        </button>
                                    ))}
                                </div>
                                {fieldErrors.skills && <p className="text-red-500 text-sm mt-1">{fieldErrors.skills}</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-medium text-gray-700">Socials</label>

                                {formData.socials.map((link, idx) => (
                                    <div key={idx} className="flex items-center gap-2 mb-2">
                                        {getPlatformIcon(link.platform)}
                                        <input
                                            placeholder={`Enter your ${link.platform} username`}
                                            className="input flex-1"
                                            value={link.username}
                                            onChange={(e) => handleSocialChange(idx, 'username', e.target.value)}
                                        />
                                    </div>
                                ))}

                                {formData.socials.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={handleAddSocial}
                                        className="text-sm text-blue-600 mt-2 font-medium hover:underline"
                                    >
                                        + ADD MORE
                                    </button>
                                )}

                            </div>

                            <button type="submit" className="btn-primary w-full py-2 flex items-center justify-center" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <span className="flex gap-1 h-[30px] items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                                    </span>
                                ) : (
                                    'Create Profile'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
