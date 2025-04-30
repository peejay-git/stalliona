'use client';

import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  );
};

export default Layout; 