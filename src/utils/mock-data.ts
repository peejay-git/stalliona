import { Bounty, BountyStatus, BountyCategory } from '@/types/bounty';

// Generate a random Stellar public key
const generateRandomStellarAddress = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = 'G';
  for (let i = 0; i < 55; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Generate future date
const generateFutureDate = (daysAhead: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString();
};

// Generate past date
const generatePastDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Mock bounties data
export const mockBounties: Bounty[] = [
  {
    id: '1',
    title: 'Build a Stellar Wallet Integration Component',
    description:
      'Create a reusable React component for connecting to Stellar wallets (Freighter, Albedo, etc.) with comprehensive documentation and examples.',
    reward: {
      amount: '500',
      asset: 'USDC',
    },
    owner: generateRandomStellarAddress(),
    deadline: generateFutureDate(14),
    status: BountyStatus.OPEN,
    category: BountyCategory.DEVELOPMENT,
    skills: ['React', 'TypeScript', 'Stellar SDK', 'Web3'],
    created: generatePastDate(5),
    updated: generatePastDate(5),
  },
  {
    id: '2',
    title: 'Design Landing Page for DeFi Application',
    description:
      'Create a modern, visually appealing landing page design for a DeFi application built on Stellar. The design should communicate trust, security, and innovation.',
    reward: {
      amount: '350',
      asset: 'USDC',
    },
    owner: generateRandomStellarAddress(),
    deadline: generateFutureDate(10),
    status: BountyStatus.OPEN,
    category: BountyCategory.DESIGN,
    skills: ['UI/UX', 'Figma', 'Web Design', 'DeFi'],
    created: generatePastDate(3),
    updated: generatePastDate(3),
  },
  {
    id: '3',
    title: 'Implement Soroban Smart Contract for Token Vesting',
    description:
      'Build a Soroban smart contract that handles token vesting schedules with configurable cliff and vesting periods. Tests and documentation required.',
    reward: {
      amount: '800',
      asset: 'USDC',
    },
    owner: generateRandomStellarAddress(),
    deadline: generateFutureDate(30),
    status: BountyStatus.OPEN,
    category: BountyCategory.DEVELOPMENT,
    skills: ['Rust', 'Soroban', 'Smart Contracts', 'Stellar'],
    created: generatePastDate(7),
    updated: generatePastDate(7),
  },
  {
    id: '4',
    title: 'Create Educational Content on Stellar and Soroban',
    description:
      'Develop a series of educational articles/videos explaining how Stellar works and the benefits of developing on Soroban for smart contracts.',
    reward: {
      amount: '250',
      asset: 'USDC',
    },
    owner: generateRandomStellarAddress(),
    deadline: generateFutureDate(21),
    status: BountyStatus.OPEN,
    category: BountyCategory.CONTENT,
    skills: ['Technical Writing', 'Education', 'Blockchain Knowledge'],
    created: generatePastDate(10),
    updated: generatePastDate(10),
  },
  {
    id: '5',
    title: 'Develop Payment Processing Plugin for WooCommerce',
    description:
      'Create a WooCommerce plugin that enables e-commerce stores to accept Stellar-based payments. Should include support for different assets.',
    reward: {
      amount: '600',
      asset: 'USDC',
    },
    owner: generateRandomStellarAddress(),
    deadline: generateFutureDate(25),
    status: BountyStatus.IN_PROGRESS,
    category: BountyCategory.DEVELOPMENT,
    skills: ['PHP', 'WordPress', 'WooCommerce', 'Stellar SDK'],
    created: generatePastDate(15),
    updated: generatePastDate(2),
  },
  {
    id: '6',
    title: 'Market Research: Stellar Adoption in Emerging Markets',
    description:
      'Conduct research on the adoption and potential of Stellar blockchain in emerging markets. Focus on remittances, financial inclusion, and local partnerships.',
    reward: {
      amount: '400',
      asset: 'USDC',
    },
    owner: generateRandomStellarAddress(),
    deadline: generateFutureDate(18),
    status: BountyStatus.OPEN,
    category: BountyCategory.RESEARCH,
    skills: ['Market Research', 'Data Analysis', 'Financial Knowledge'],
    created: generatePastDate(6),
    updated: generatePastDate(6),
  },
]; 