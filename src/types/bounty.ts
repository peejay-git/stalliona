export enum BountyStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BountyCategory {
  DEVELOPMENT = 'DEVELOPMENT',
  DESIGN = 'DESIGN',
  CONTENT = 'CONTENT',
  MARKETING = 'MARKETING',
  RESEARCH = 'RESEARCH',
  OTHER = 'OTHER',
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: {
    amount: string;
    asset: string; // Asset code, e.g., "USDC"
  };
  owner: string; // Stellar address of the bounty creator
  deadline: string; // ISO date string
  status: BountyStatus;
  category: BountyCategory;
  skills: string[];
  created: string; // ISO date string
  updated: string; // ISO date string
}

export interface Submission {
  id: string;
  bountyId: string;
  applicant: string; // Stellar address of the submitter
  content: string; // Submission content or link to work
  created: string; // ISO date string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface BountyWithSubmissions extends Bounty {
  submissions: Submission[];
} 