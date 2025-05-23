'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBountyById, updateBounty, bountyHasSubmissions } from '@/lib/bounties';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { Bounty } from '@/types/bounty';

const categoriesOptions = [
    'Development',
    'Design',
    'Content',
    'Marketing',
    'Community',
    'Translation',
    'Research',
    'Other'
];

const skillsOptions = [
    'JavaScript',
    'React',
    'Node.js',
    'Solidity',
    'Python',
    'UI/UX',
    'Graphic Design',
    'Writing',
    'Marketing',
    'Community Management',
    'Translation',
    'Research'
];

const assetOptions = ['USDC', 'XLM', 'ETH'];

export default function EditBountyPage({ params }: { params: { id: string } }) {
    useProtectedRoute();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [bounty, setBounty] = useState<Bounty | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        deadline: '',
        skills: [] as string[],
        reward: {
            amount: '',
            asset: 'USDC'
        }
    });

    // Fetch the bounty data and check permissions
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                try {
                    // Fetch bounty data
                    const data = await getBountyById(params.id);
                    if (!data) {
                        toast.error('Bounty not found');
                        router.push('/dashboard');
                        return;
                    }

                    // Check if user is the owner
                    if (data.owner !== user.uid) {
                        toast.error('You do not have permission to edit this bounty');
                        router.push(`/bounties/${params.id}`);
                        return;
                    }

                    // Check if bounty has submissions
                    const hasSubmissions = await bountyHasSubmissions(params.id);
                    if (hasSubmissions) {
                        toast.error('This bounty already has submissions and cannot be edited');
                        router.push(`/bounties/${params.id}`);
                        return;
                    }

                    // Initialize form with bounty data
                    setBounty(data);
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        category: data.category || '',
                        deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
                        skills: data.skills || [],
                        reward: {
                            amount: data.reward?.amount?.toString() || '',
                            asset: data.reward?.asset || 'USDC'
                        }
                    });
                } catch (err: any) {
                    console.error(err);
                    setError(err.message || 'Error loading bounty');
                    toast.error('Error loading bounty data');
                } finally {
                    setLoading(false);
                }
            } else {
                // User is not logged in, redirect to login
                router.push('/bounties');
            }
        });

        return () => unsubscribe();
    }, [params.id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent as keyof typeof prev] as any,
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSkillToggle = (skill: string) => {
        setFormData(prev => {
            const skills = prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill];
            
            return {
                ...prev,
                skills
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Validate form data
            if (!formData.title) throw new Error('Title is required');
            if (!formData.description) throw new Error('Description is required');
            if (!formData.category) throw new Error('Category is required');
            if (!formData.deadline) throw new Error('Deadline is required');
            if (!formData.reward.amount) throw new Error('Reward amount is required');
            if (formData.skills.length === 0) throw new Error('At least one skill is required');

            // Format data for update
            const updatedBounty = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                deadline: formData.deadline,
                skills: formData.skills,
                reward: {
                    amount: formData.reward.amount,
                    asset: formData.reward.asset
                }
            };

            await updateBounty(params.id, updatedBounty);
            toast.success('Bounty updated successfully');
            router.push(`/bounties/${params.id}`);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error updating bounty');
            toast.error(err.message || 'Error updating bounty');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen py-12 px-4 sm:px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="animate-pulse">
                            <div className="h-8 bg-white/10 rounded w-1/3 mb-8"></div>
                            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8">
                                <div className="h-6 bg-white/10 rounded w-1/4 mb-6"></div>
                                <div className="h-10 bg-white/10 rounded mb-6"></div>
                                <div className="h-6 bg-white/10 rounded w-1/4 mb-6"></div>
                                <div className="h-40 bg-white/10 rounded mb-6"></div>
                                <div className="h-6 bg-white/10 rounded w-1/4 mb-6"></div>
                                <div className="h-10 bg-white/10 rounded mb-6"></div>
                                <div className="h-12 bg-white/10 rounded w-1/3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen py-12 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8 text-white">Edit Bounty</h1>

                    {error && (
                        <div className="bg-red-900/20 text-red-300 border border-red-700/30 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8">
                        <div className="mb-6">
                            <label htmlFor="title" className="block text-white font-medium mb-2">
                                Title*
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="input w-full"
                                placeholder="E.g. 'Design a Logo for Our DAO'"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="description" className="block text-white font-medium mb-2">
                                Description*
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="input w-full"
                                rows={6}
                                placeholder="Detailed description of what you're looking for..."
                                required
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="category" className="block text-white font-medium mb-2">
                                    Category*
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="input w-full"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categoriesOptions.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="deadline" className="block text-white font-medium mb-2">
                                    Deadline*
                                </label>
                                <input
                                    type="date"
                                    id="deadline"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    className="input w-full"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-white font-medium mb-2">Skills Required*</label>
                            <div className="flex flex-wrap gap-2">
                                {skillsOptions.map(skill => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => handleSkillToggle(skill)}
                                        className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                                            formData.skills.includes(skill)
                                                ? 'bg-blue-500/30 text-blue-200 border-blue-500/50'
                                                : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                                        }`}
                                    >
                                        {skill} {formData.skills.includes(skill) ? '✓' : '+'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label htmlFor="reward.amount" className="block text-white font-medium mb-2">
                                    Reward Amount*
                                </label>
                                <input
                                    type="number"
                                    id="reward.amount"
                                    name="reward.amount"
                                    value={formData.reward.amount}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="E.g. 100"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label htmlFor="reward.asset" className="block text-white font-medium mb-2">
                                    Asset Type*
                                </label>
                                <select
                                    id="reward.asset"
                                    name="reward.asset"
                                    value={formData.reward.asset}
                                    onChange={handleChange}
                                    className="input w-full"
                                    required
                                >
                                    {assetOptions.map(asset => (
                                        <option key={asset} value={asset}>{asset}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push(`/bounties/${params.id}`)}
                                className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-3 px-6 rounded-lg hover:bg-white/20 transition-colors"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-white text-black font-medium py-3 px-6 rounded-lg hover:bg-white/90 transition-colors flex-1"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <span className="flex gap-2 items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
                                    </span>
                                ) : (
                                    'Update Bounty'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
} 