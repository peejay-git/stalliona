// src/components/AppClientWrapper.tsx
'use client';

import { ReactNode, useEffect, memo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { initUserStore } from '@/utils/initUserStore';
import preloadCriticalAssets from '@/utils/preloadAssets';

function AppClientWrapper({ children }: { children: ReactNode }) {
    const [storeInitialized, setStoreInitialized] = useState(false);

    // Initialize user store only once on mount
    useEffect(() => {
        // Check if already initialized to prevent duplicate initializations
        if (typeof window !== 'undefined' && !window.__STORE_INITIALIZED) {
            window.__STORE_INITIALIZED = true;
            
            try {
                initUserStore();
                setStoreInitialized(true);
            } catch (error) {
                console.error('Failed to initialize user store:', error);
                // Set initialized anyway to prevent infinite retries
                setStoreInitialized(true);
            }
        } else {
            setStoreInitialized(true);
        }
    }, []);

    return (
        <>
            {children}
            <Toaster 
                position="top-right" 
                gutter={8}
                toastOptions={{
                    // Reduce animation duration for better performance
                    duration: 3000,
                    style: {
                        background: '#333',
                        color: '#fff',
                        maxWidth: '320px',
                    },
                }}
            />
        </>
    );
}

// Add type definition for the global window object
declare global {
    interface Window {
        __STORE_INITIALIZED?: boolean;
    }
}

// Memoize to prevent unnecessary re-renders
export default memo(AppClientWrapper);
