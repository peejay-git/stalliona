'use client';

import clsx from 'clsx';
import { FaUserTie, FaUserGraduate } from 'react-icons/fa';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onChooseRole: (role: 'talent' | 'sponsor') => void;
};

export default function ChooseRoleModal({ isOpen, onClose, onChooseRole }: Props) {
    return (
        <div
            className={clsx(
                'fixed inset-0 z-50 flex items-center justify-center transition-all duration-300',
                isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
            )}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-8 z-10">
                <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
                    Choose Your Role
                </h2>

                <div className="flex flex-col sm:flex-row gap-6 justify-between">
                    {/* Talent Card */}
                    <button
                        onClick={() => onChooseRole('talent')}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-6 flex flex-col items-center text-center transition shadow-sm hover:shadow-md"
                    >
                        <FaUserGraduate className="text-blue-500 text-4xl mb-4" />
                        <h3 className="text-lg font-semibold text-blue-700 mb-2">I'm a Talent</h3>
                        <p className="text-sm text-blue-600">
                            Looking to grow your skills, earn crypto, and work on Web3 projects.
                        </p>
                    </button>

                    {/* Sponsor Card */}
                    <button
                        onClick={() => onChooseRole('sponsor')}
                        className="flex-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-6 flex flex-col items-center text-center transition shadow-sm hover:shadow-md"
                    >
                        <FaUserTie className="text-purple-500 text-4xl mb-4" />
                        <h3 className="text-lg font-semibold text-purple-700 mb-2">I'm a Sponsor</h3>
                        <p className="text-sm text-purple-600">
                            Want to fund bounties, grow communities, and discover talent in Web3.
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}
