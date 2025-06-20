'use client';

import { useWallet } from '@/hooks/useWallet';
import { useUserStore } from '@/lib/stores/useUserStore';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useState } from 'react';
import ChooseRoleModal from './ChooseRoleModal';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

// Pre-defined nav links to avoid recreation on render
const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Bounties', href: '/bounties' },
];

// Separate Create Bounty link to conditionally show it
const createBountyLink = { name: 'Create', href: '/create' };

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected, publicKey, connect, disconnect } = useWallet();
  const [showRegister, setShowRegister] = useState(false);
  const [isChooseRoleOpen, setChooseRoleOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();
  const { user, clearUser } = useUserStore((state) => state);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Synchronize wallet and user state
  // useEffect(() => {
  //   // Check if we're in the signup process by looking at the current route
  //   const isInSignupProcess =
  //     pathname === '/register' ||
  //     pathname.startsWith('/register/') ||
  //     showRegister ||
  //     isChooseRoleOpen;

  //   // Only disconnect wallet if user is logged out, wallet is connected, and not in signup
  //   if (!user && isConnected && !isInSignupProcess) {
  //     disconnect();
  //   }
  // }, [user, isConnected, disconnect, pathname, showRegister, isChooseRoleOpen]);

  // Memoized toggle function
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Modal handlers
  const handleLoginClose = useCallback(() => setShowLogin(false), []);
  const handleRegisterClose = useCallback(() => setShowRegister(false), []);
  const handleChooseRoleClose = useCallback(() => setChooseRoleOpen(false), []);

  const handleSwitchToRegister = useCallback(() => {
    setShowLogin(false);
    setChooseRoleOpen(true);
  }, []);

  const handleChooseRole = useCallback(
    (role: string) => {
      setChooseRoleOpen(false);
      if (role === 'talent') {
        setShowRegister(true);
      } else {
        router.push('/register/sponsor');
      }
    },
    [router]
  );

  const handleLogout = useCallback(() => {
    // Confirm logout
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (!confirmLogout) return;

    clearUser();
    disconnect();
    router.push('/');
  }, [disconnect, clearUser]);

  // Only check localStorage once
  useEffect(() => {
    try {
      const userProfileCompleted = localStorage.getItem('userProfileCompleted');
      setIsNewUser(userProfileCompleted === null);
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#070708] shadow-md">
      {showLogin && (
        <LoginModal
          isOpen={showLogin}
          onClose={handleLoginClose}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}
      {showRegister && (
        <RegisterModal isOpen={showRegister} onClose={handleRegisterClose} />
      )}
      {isChooseRoleOpen && (
        <ChooseRoleModal
          isOpen={isChooseRoleOpen}
          onClose={handleChooseRoleClose}
          onChooseRole={handleChooseRole}
        />
      )}

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
                  priority
                />
                <span className="text-xl font-bold text-white">Stallion</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 bg-white/5 p-3 rounded-2xl">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium whitespace-nowrap nav-txt p-3 rounded-[10px] ${
                  pathname === link.href
                    ? 'text-white bg-white/10'
                    : 'text-[#797C86] hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Only show Create link for sponsors */}
            {user && user.role === 'sponsor' && (
              <Link
                href={createBountyLink.href}
                className={`font-medium whitespace-nowrap nav-txt p-3 rounded-[10px] ${
                  pathname === createBountyLink.href
                    ? 'text-white bg-white/10'
                    : 'text-[#797C86] hover:bg-white/10 hover:text-white'
                }`}
              >
                {createBountyLink.name}
              </Link>
            )}

            {user && (
              <Link
                href="/dashboard"
                className={`font-medium whitespace-nowrap nav-txt p-3 rounded-[10px] ${
                  pathname === '/dashboard'
                    ? 'text-white bg-white/10'
                    : 'text-[#797C86] hover:bg-white/10 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Wallet Connect Button (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected && !user && (
              <button
                onClick={() => setChooseRoleOpen(true)}
                className="bg-white text-black font-medium py-1.5 px-4 rounded-lg hover:bg-white/90 complete-profile"
              >
                Complete Profile
              </button>
            )}

            {/* Authentication/Wallet buttons - mutually exclusive states */}
            {user ? (
              // show logout
              <button
                onClick={handleLogout}
                className="bg-white text-black font-medium py-1.5 px-4 rounded-lg hover:bg-white/90"
              >
                Logout
              </button>
            ) : isConnected && publicKey ? ( // User is logged in - show dashboard button in nav
              // Wallet connected but no user - show disconnect button
              <button
                onClick={disconnect}
                className="bg-white text-black font-medium py-1.5 px-3 text-sm rounded-lg hover:bg-white/90"
              >
                Disconnect
              </button>
            ) : (
              // No wallet connected and no user - show login button
              <button
                onClick={() => setShowLogin(true)}
                className="bg-white text-black font-medium py-1.5 px-4 rounded-lg hover:bg-white/90"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
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
                  d={
                    isMenuOpen
                      ? 'M6 18L18 6M6 6l12 12'
                      : 'M4 6h16M4 12h16M4 18h16'
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          className="md:hidden bg-[#070708]/90 border-t border-white/10"
          id="mobile-menu"
        >
          <div className="pt-2 pb-4 space-y-1 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 font-medium ${
                  pathname === link.href
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={toggleMenu}
              >
                {link.name}
              </Link>
            ))}

            {/* Only show Create link for sponsors */}
            {user && user.role === 'sponsor' && (
              <Link
                href={createBountyLink.href}
                className={`block py-2 font-medium ${
                  pathname === createBountyLink.href
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={toggleMenu}
              >
                {createBountyLink.name}
              </Link>
            )}

            {user && (
              <Link
                href="/dashboard"
                className={`block py-2 font-medium ${
                  pathname === '/dashboard'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="pt-4 pb-3 border-t border-white/10">
            {/* Authentication/Wallet buttons for mobile - mutually exclusive states */}
            {user ? null : isConnected && publicKey ? ( // User is logged in - no need for buttons (dashboard link is in nav)
              // Wallet connected but no user
              <button
                onClick={() => {
                  disconnect();
                  setIsMenuOpen(false);
                }}
                className="bg-white text-black font-medium py-1.5 w-full rounded-lg hover:bg-white/90"
              >
                Disconnect
              </button>
            ) : (
              // No wallet connected and no user
              <button
                onClick={() => {
                  setShowLogin(true);
                  setIsMenuOpen(false);
                }}
                className="bg-white text-black font-medium py-1.5 px-4 w-full mb-2 rounded-lg hover:bg-white/90"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default memo(Header);
