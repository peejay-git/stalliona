/**
 * Supported tokens on the Stellar network
 *
 * These are the asset contract IDs for the Stellar testnet
 */

export interface Token {
  symbol: string;
  name: string;
  logo: string;
  address: string;
}

// Token address mapping for blockchain contract integration
export const TOKEN_ADDRESSES: Record<string, string> = {
  USDC: 'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5',
  NGNC: 'CBYFV4W2LTMXYZ3XWFX5BK2BY255DU2DSXNAE4FJ5A5VYUWGIBJDOIGG',
  KALE: 'CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV',
  XLM: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
};

// Available tokens with their details for UI display
export const SUPPORTED_TOKENS: Token[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    logo: '/images/tokens/usdc.svg',
    address: TOKEN_ADDRESSES.USDC,
  },
  {
    symbol: 'NGNC',
    name: 'NGNC',
    logo: '/images/tokens/ngnc.svg',
    address: TOKEN_ADDRESSES.NGNC,
  },
  {
    symbol: 'KALE',
    name: 'KALE',
    logo: '/images/tokens/kale.svg',
    address: TOKEN_ADDRESSES.KALE,
  },
  {
    symbol: 'XLM',
    name: 'Stellar Lumens',
    logo: '/images/tokens/xlm.svg',
    address: TOKEN_ADDRESSES.XLM,
  },
];

/**
 * Get token by symbol
 */
export function getTokenBySymbol(symbol: string): Token | undefined {
  return SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
}

/**
 * Get token by address
 */
export function getTokenByAddress(address: string): Token | undefined {
  return SUPPORTED_TOKENS.find((t) => t.address === address);
}
