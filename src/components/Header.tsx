'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useWallet } from '@/hooks/useWallet';
import { IoWalletOutline } from "react-icons/io5";
import RegisterModal from './RegisterModal';
import LoginModal from './LoginModal';
import ChooseRoleModal from './ChooseRoleModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const {
    // isConnected, publicKey,
    connect, disconnect } = useWallet();
  const [showRegister, setShowRegister] = useState(false);
  const [isChooseRoleOpen, setChooseRoleOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  let isConnected = true; // Placeholder for isConnected state
  let publicKey = "0x1234567890abcdef"; // Placeholder for publicKey state

  const navLinks = [
    { name: 'Home', href: '/' },
    // { name: 'About Us', href: '/about' },
    // { name: 'Our Services', href: '/services' },
    // { name: 'Contact', href: '/contact' },
    { name: 'Bounties', href: '/bounties' },
    { name: 'Create', href: '/create' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

  const isBountiesPage = pathname === '/bounties';
  useEffect(() => {
    // Check if the user has a profile completed flag in localStorage
    const userProfileCompleted = localStorage.getItem('userProfileCompleted');

    if (userProfileCompleted === null) {
      // If the key doesn't exist, it's a new user
      setIsNewUser(true);
    } else {
      // If the key exists, they are a returning user
      setIsNewUser(false);
    }
  }, []);
  return (
    <header className={`relative sticky top-0 z-50 ${isBountiesPage ? "bg-white" : "bg-gradient-to-r from-[#070708] to-[#070708]"}`}>
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setChooseRoleOpen(true);
        }}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
      />
      <ChooseRoleModal
        isOpen={isChooseRoleOpen}
        onClose={() => setChooseRoleOpen(false)}
        onChooseRole={(role) => {
          setChooseRoleOpen(false);
          if (role === 'talent') {
            setShowRegister(true); // Open RegisterModal
          } else {
            router.push('/register/sponsor'); // Redirect
          }
        }}
      />
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
                {/* <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Stallion</span> */}
                <span className={`text-xl font-bold bg-clip-text ${isBountiesPage ? "text-transparent bg-gradient-to-r from-blue-600 to-purple-600" : "text-white"}`}>
                  Stallion
                </span>

              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 backdrop-blur-xl shadow-md p-3 rounded-2xl transition-all duration-300">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-medium whitespace-nowrap transition-colors nav-txt p-3 rounded-[10px] ${pathname === link.href
                  ? 'text-[#9EA2FA] backdrop-blur-xl bg-white/10'
                  : 'text-[#797C86] hover:bg-white/10 hover:backdrop-blur-xl hover:text-[#9EA2FA] '
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Wallet Connect Button (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {/* <Link
              href="/register"> */}
            {isConnected && !isNewUser ? (<button
              onClick={() => setChooseRoleOpen(true)}
              className="btn-secondary  py-1.5 px-4 flex items-center gap-2 complete-profile"
            >
              Complete Profile
            </button>) :
              isConnected && isNewUser ? (
                <button
                  onClick={() => setShowLogin(true)}
                  className="btn-secondary  py-1.5 px-4 flex items-center gap-2 complete-profile"
                >
                  Login
                </button>
              ) : null}
            {/* </Link> */}
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
                className={`btn-ordinary py-1.5 px-4 flex items-center gap-2 ${isBountiesPage ? "btn-primary" : "btn-ordinary"}`}
              >
                <IoWalletOutline className='text-[20px]' />
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
                className={`block py-2 font-medium ${pathname === link.href
                  ? 'text-stellar-blue'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 pb-3 border-t border-gray-200">

              <button
                onClick={() => setShowLogin(true)}
                className="btn-primary py-1.5 px-4 w-full mb-2"
              >
                Login
              </button>
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
                  className="btn-primary py-1.5 w-full flex items-center justify-center gap-2"
                >
                  <IoWalletOutline className='text-[20px]' />
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