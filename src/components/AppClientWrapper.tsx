// src/components/AppClientWrapper.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { initUserStore } from '@/utils/initUserStore';

export default function AppClientWrapper({ children }: { children: ReactNode }) {
    useEffect(() => {
        initUserStore();
    }, []);

    return (
        <>
            {children}
            <Toaster position="top-right" />
        </>
    );
}
