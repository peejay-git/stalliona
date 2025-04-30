'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useWallet } from '@/hooks/useWallet';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected, publicKey, connect, disconnect } = useWallet();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Bounties', href: '/bounties' },
    { name: 'Create', href: '/create' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-4 md:py-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <Image 
                  src="/images/unicorn-logo.svg" 
                  alt="Stallion Logo" 
                  width={32} 
                  height={32}
                  className="rounded-full"
                />
                <span className="text-xl font-bold gradient-text">Stallion</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-stellar-blue'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Wallet Connect Button (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 truncate max-w-[120px]">
                  {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
                </span>
                <button
                  onClick={disconnect}
                  className="btn-secondary py-1.5 px-3 text-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="btn-primary py-1.5 px-4"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200" id="mobile-menu">
          <div className="pt-2 pb-4 space-y-1 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block py-2 font-medium ${
                  pathname === link.href
                    ? 'text-stellar-blue'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 pb-3 border-t border-gray-200">
              {isConnected ? (
                <div className="flex flex-col space-y-3">
                  <span className="text-sm text-gray-600">
                    Connected: {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
                  </span>
                  <button
                    onClick={() => {
                      disconnect();
                      setIsMenuOpen(false);
                    }}
                    className="btn-secondary py-1.5 w-full"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    connect();
                    setIsMenuOpen(false);
                  }}
                  className="btn-primary py-1.5 w-full"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 