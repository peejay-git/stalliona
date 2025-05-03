'use client';

import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-6">
            <h1 className="text-6xl font-bold text-stellar-blue mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-6">
                Oops! The page you’re looking for doesn’t exist or has been moved.
            </p>
            <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-stellar-blue text-white rounded hover:bg-stellar-navy transition"
            >
                <FaArrowLeft />
                Go Back Home
            </Link>
        </div>
    );
}
