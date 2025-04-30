# Stallion

A Web3 platform for connecting talent with Stellar blockchain projects, powered by Soroban smart contracts.

![Stallion](https://stellar.org/developers/stallion-preview.png)

## Features

- Create and manage bounties with rewards in Stellar-based tokens (USDC, XLM, etc.)
- Browse available bounties by category, rewards, and skills
- Submit work for review and receive payments directly through smart contracts
- User authentication via Stellar wallet (Freighter)
- Smart contract-based escrow and payment system
- Dashboard for tracking created bounties and submissions

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Blockchain**: Stellar, Soroban (smart contracts)
- **Wallet Integration**: Freighter API
- **Smart Contracts**: Rust/Soroban

## Project Structure

```
stallion/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── bounties/           # Bounty listing and detail pages
│   │   ├── create/             # Bounty creation page
│   │   ├── dashboard/          # User dashboard page
│   │   └── page.tsx            # Homepage
│   ├── components/             # React components
│   ├── contracts/              # Soroban smart contracts
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Library functions
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── public/                     # Static assets
└── ...configuration files
```

## Prerequisites

- Node.js 18+
- Stellar account with Freighter wallet
- Soroban CLI (for contract deployment)

## Setup and Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/stallion.git
cd stallion
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your configuration:

```
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_BOUNTY_CONTRACT_ID=your_deployed_contract_id
```

4. Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Smart Contract Deployment

The bounty smart contract is written in Rust for the Soroban platform. To deploy:

1. Install the Soroban CLI:

```bash
cargo install soroban-cli
```

2. Build the contract:

```bash
cd stallion
soroban contract build --package bounty-contract
```

3. Deploy to testnet:

```bash
soroban contract deploy \
  --network testnet \
  --source <your_secret_key> \
  --wasm target/wasm32-unknown-unknown/release/bounty_contract.wasm
```

4. Update your `.env.local` file with the deployed contract ID.

## Key Components

### Bounty Contract

The Soroban smart contract handles the creation, funding, submission, and payment processes for bounties. See `src/contracts/bounty.rs` for the implementation.

### Wallet Integration

The platform integrates with Stellar wallets using the Freighter API for authentication and transaction signing. See `src/hooks/useWallet.tsx` for implementation.

### Soroban Service

The `src/lib/soroban.ts` file provides a TypeScript interface for interacting with the deployed Soroban smart contract.

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Deployment

This application can be deployed on Vercel, Netlify, or any hosting service that supports Next.js applications.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Stellar Development Foundation](https://stellar.org)
- [Soroban Documentation](https://soroban.stellar.org)
- [Next.js](https://nextjs.org)
- [TailwindCSS](https://tailwindcss.com)
- [Freighter Wallet](https://www.freighter.app) 