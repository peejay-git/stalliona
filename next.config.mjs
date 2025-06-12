/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['stellar.org', 'ipfs.io', 'firebasestorage.googleapis.com', 'earnstallions.xyz', 'www.earnstallions.xyz'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  env: {
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.STELLAR_NETWORK || 'Test SDF Network ; September 2015',
    NEXT_PUBLIC_SOROBAN_RPC_URL: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
    // Add AUTH_DOMAIN as fallback for environments where Firebase env vars might not be fully loaded
    NEXT_PUBLIC_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "earnstallions.xyz", 
  },
  webpack: (config, { isServer }) => {
    // Browser polyfills needed for Stellar SDK
    if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        util: false,
      };
    }
    
    return config;
  },
  // Avoid CORS issues with API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig; 