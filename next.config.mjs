/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['stellar.org', 'ipfs.io'],
  },
  env: {
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.STELLAR_NETWORK || 'TESTNET',
    NEXT_PUBLIC_SOROBAN_RPC_URL: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig; 