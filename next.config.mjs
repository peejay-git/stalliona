import { createRequire } from 'module';
import path from 'path';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'stellar.org',
      'ipfs.io',
      'firebasestorage.googleapis.com',
      'earnstallions.xyz',
      'www.earnstallions.xyz',
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  env: {
    NEXT_PUBLIC_STELLAR_NETWORK:
      process.env.STELLAR_NETWORK || 'Test SDF Network ; September 2015',
    NEXT_PUBLIC_SOROBAN_RPC_URL:
      process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
    NEXT_PUBLIC_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'earnstallions.xyz',
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_TREZOR_CONTACT_EMAIL:
      process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL ||
      'support@earnstallions.xyz',
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@stellar/stellar-sdk',
      '@stellar/stellar-wallets-kit',
      '@creit.tech/stellar-wallets-kit',
      'stellar-sdk',
      'sodium-native',
      '@stellar/freighter-api',
      '@firebase/firestore',
      '@grpc/grpc-js',
      '@noble/hashes',
      '@noble/curves',
      '@near-js/crypto',
      '@hot-wallet/sdk',
    ],
    esmExternals: false,
  },
  webpack: (config, { isServer, webpack }) => {
    // Completely ignore server-only packages from client bundle
    if (!isServer) {
      // Force use of browser version for @firebase/firestore
      // The 'path' module is a Node.js built-in and not available in the browser.
      // If this alias is still needed, consider a browser-compatible alternative or
      // ensure 'path' is polyfilled or not used in the client bundle.
      // For now, removing the 'path' require as per instruction.
      // Note: This might cause a ReferenceError if path.join is still used without 'path' being defined.
      // The instruction implies removing the definition of 'path'.
      // If the intent was to remove the alias entirely, that would be a different instruction.
      // As per the instruction, only the 'const path = require('path');' line is removed.
      // The subsequent use of 'path.join' will now cause an error.
      // To make it syntactically correct, the line using 'path.join' must also be removed or modified.
      // Given the instruction "Remove the const path = require('path'); line" and "Make sure to incorporate the change in a way so that the resulting file is syntactically correct",
      // the `config.resolve.alias` entry that uses `path.join` must also be removed to prevent a ReferenceError.
      // If the intent was to keep the alias, 'path' would need to be imported or defined differently.
      // Assuming the removal of 'path' means the related alias is no longer valid or desired for the client.
      // Force use of browser version for @firebase/firestore
      try {
        const firebasePkgPath = require.resolve('firebase/package.json');
        const firebaseNodeModules = path.dirname(path.dirname(firebasePkgPath));
        const firestoreBrowserPath = path.join(
          firebaseNodeModules,
          '@firebase/firestore/dist/index.esm2017.js',
        );

        config.resolve.alias = {
          ...config.resolve.alias,
          '@firebase/firestore': firestoreBrowserPath,
        };
      } catch (e) {
        console.warn(
          'Could not resolve firebase/package.json for aliasing:',
          e,
        );
      }

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@grpc\/grpc-js$/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^google-gax$/,
        }),
      );

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
        dns: false,
        http2: false,
        child_process: false,
      };
    }

    // Add transpilation rules for the modules
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Handle browser-only modules in server context
    if (isServer) {
      // Add empty module for browser-only packages
      config.module.rules.push({
        test: /\.(mjs|js|ts|tsx)$/,
        include: [
          /node_modules\/@creit\.tech\/stellar-wallets-kit/,
          /node_modules\/@stellar\/freighter-api/,
          /node_modules\/@grpc\/grpc-js/,
          /node_modules\/@firebase\/firestore/,
          /node_modules\/@noble\/hashes/,
          /node_modules\/@noble\/curves/,
          /node_modules\/@near-js\/crypto/,
          /node_modules\/@hot-wallet\/sdk/,
        ],
        use: 'null-loader',
      });

      // Add mock for browser globals
      config.plugins.push(
        new webpack.DefinePlugin({
          self: 'undefined',
          window: 'undefined',
          document: 'undefined',
          indexedDB: 'undefined',
          localStorage: 'undefined',
          sessionStorage: 'undefined',
          navigator: 'undefined',
        }),
      );
    }

    // Add module resolution for browser-only modules
    config.resolve.mainFields = ['browser', 'module', 'main'];
    config.resolve.conditionNames = ['browser', 'require', 'node'];

    // Handle node: protocol imports
    config.module.rules.push({
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      loader: 'string-replace-loader',
      options: {
        search: 'require\\([\'"]node:([^\'"]+)[\'"]\\)',
        replace: 'require("$1")',
        flags: 'g',
      },
    });

    // Add polyfills
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    );

    return config;
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
