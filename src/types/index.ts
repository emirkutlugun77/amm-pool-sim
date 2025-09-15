export interface Coin {
  id: string;
  name: string;
  symbol: string;
  color: string;
  totalSupply: number;
}

export interface Pool {
  id: string;
  coinA: Coin;
  coinB: Coin;
  reserveA: number;
  reserveB: number;
  lpTokenSupply: number;
  createdAt: number;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeFrame {
  value: string;
  label: string;
  interval: number; // milliseconds
}

export interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Transaction {
  id: string;
  poolId: string;
  type: 'buy' | 'sell' | 'add_liquidity' | 'remove_liquidity';
  amountIn: number;
  amountOut: number;
  tokenIn: string;
  tokenOut: string;
  timestamp: number;
  price: number;
}

export interface SwapQuote {
  amountIn: number;
  amountOut: number;
  priceImpact: number;
  fee: number;
  newPrice: number;
}

