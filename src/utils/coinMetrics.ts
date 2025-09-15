import { Coin, Pool, Transaction } from '../types';

export interface CoinMetrics {
  price: number;
  marketCap: number;
  fdv: number; // Fully Diluted Valuation
  volume24h: number;
  priceChange24h: number;
  circulatingSupply: number;
}

export class CoinMetricsCalculator {
  // Calculate current price of a coin in USDT
  static getCurrentPrice(coin: Coin, pools: Pool[]): number {
    // USDT is always $1
    if (coin.symbol === 'USDT') return 1.0;

    // Find pools with USDT
    const usdtPools = pools.filter(pool => 
      (pool.coinA.id === coin.id && pool.coinB.symbol === 'USDT') ||
      (pool.coinB.id === coin.id && pool.coinA.symbol === 'USDT')
    );

    if (usdtPools.length === 0) return 0;

    // Get the pool with highest TVL
    const bestPool = usdtPools.reduce((prev, current) => {
      const prevTVL = prev.reserveA + prev.reserveB;
      const currentTVL = current.reserveA + current.reserveB;
      return currentTVL > prevTVL ? current : prev;
    });

    // Calculate price: USDT_amount / TOKEN_amount
    if (bestPool.coinA.id === coin.id && bestPool.coinB.symbol === 'USDT') {
      // TOKEN/USDT pool: price = USDT_reserve / TOKEN_reserve
      return bestPool.reserveB / bestPool.reserveA;
    } else if (bestPool.coinB.id === coin.id && bestPool.coinA.symbol === 'USDT') {
      // USDT/TOKEN pool: price = USDT_reserve / TOKEN_reserve
      return bestPool.reserveA / bestPool.reserveB;
    }

    return 0;
  }

  // Calculate 24h volume for a coin
  static get24hVolume(coin: Coin, transactions: Transaction[], pools: Pool[]): number {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Get relevant pools
    const coinPools = pools.filter(pool => 
      pool.coinA.id === coin.id || pool.coinB.id === coin.id
    );
    const poolIds = coinPools.map(pool => pool.id);

    // Filter transactions from last 24h
    const recentTransactions = transactions.filter(tx => 
      tx.timestamp >= oneDayAgo && poolIds.includes(tx.poolId)
    );

    // Calculate volume in USDT
    let totalVolume = 0;
    const currentPrice = this.getCurrentPrice(coin, pools);

    recentTransactions.forEach(tx => {
      if (tx.tokenIn === coin.symbol) {
        totalVolume += tx.amountIn * currentPrice;
      } else if (tx.tokenOut === coin.symbol) {
        totalVolume += tx.amountOut * currentPrice;
      }
    });

    return totalVolume;
  }

  // Calculate 24h price change
  static get24hPriceChange(coin: Coin, pools: Pool[]): number {
    // USDT is stable, no change
    if (coin.symbol === 'USDT') return 0;

    const coinPools = pools.filter(pool => 
      pool.coinA.id === coin.id || pool.coinB.id === coin.id
    );

    if (coinPools.length === 0) return 0;

    const currentPrice = this.getCurrentPrice(coin, pools);
    if (currentPrice === 0) return 0;

    // Find the most liquid pool (highest TVL)
    const bestPool = coinPools.reduce((prev, current) => {
      const prevTVL = prev.reserveA + prev.reserveB;
      const currentTVL = current.reserveA + current.reserveB;
      return currentTVL > prevTVL ? current : prev;
    });

    if (bestPool.priceHistory.length < 2) {
      // No price history yet, return 0
      return 0;
    }

    // Get first and last prices from history
    const firstPoint = bestPool.priceHistory[0];
    const lastPoint = bestPool.priceHistory[bestPool.priceHistory.length - 1];
    
    let initialPrice, currentPriceFromHistory;
    
    // Determine price based on pool structure
    if (bestPool.coinA.id === coin.id && bestPool.coinB.symbol === 'USDT') {
      // TOKEN/USDT pool: price = USDT_reserve / TOKEN_reserve
      initialPrice = firstPoint.open;
      currentPriceFromHistory = lastPoint.close;
    } else if (bestPool.coinB.id === coin.id && bestPool.coinA.symbol === 'USDT') {
      // USDT/TOKEN pool: price = USDT_reserve / TOKEN_reserve  
      initialPrice = firstPoint.open;
      currentPriceFromHistory = lastPoint.close;
    } else {
      // Other pairs - use direct price
      initialPrice = firstPoint.open;
      currentPriceFromHistory = lastPoint.close;
    }

    if (initialPrice <= 0) return 0;

    const priceChange = ((currentPriceFromHistory - initialPrice) / initialPrice) * 100;
    
    console.log('Price change calculation:', {
      coin: coin.symbol,
      initialPrice,
      currentPriceFromHistory,
      priceChange,
      poolType: `${bestPool.coinA.symbol}/${bestPool.coinB.symbol}`
    });

    return priceChange;
  }

  // Calculate circulating supply (for now, assume 70% of total supply is circulating)
  static getCirculatingSupply(coin: Coin): number {
    return coin.totalSupply * 0.7;
  }

  // Calculate all metrics for a coin
  static calculateMetrics(
    coin: Coin, 
    pools: Pool[], 
    transactions: Transaction[]
  ): CoinMetrics {
    const price = this.getCurrentPrice(coin, pools);
    const circulatingSupply = this.getCirculatingSupply(coin);
    const marketCap = price * circulatingSupply;
    const fdv = price * coin.totalSupply;
    const volume24h = this.get24hVolume(coin, transactions, pools);
    const priceChange24h = this.get24hPriceChange(coin, pools);

    return {
      price,
      marketCap,
      fdv,
      volume24h,
      priceChange24h,
      circulatingSupply
    };
  }

  // Format large numbers (1.2M, 1.5B, etc.)
  static formatLargeNumber(num: number): string {
    if (num === 0) return '0';
    
    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    
    if (absNum >= 1e12) {
      return sign + (absNum / 1e12).toFixed(2) + 'T';
    } else if (absNum >= 1e9) {
      return sign + (absNum / 1e9).toFixed(2) + 'B';
    } else if (absNum >= 1e6) {
      return sign + (absNum / 1e6).toFixed(2) + 'M';
    } else if (absNum >= 1e3) {
      return sign + (absNum / 1e3).toFixed(2) + 'K';
    } else {
      return sign + absNum.toFixed(2);
    }
  }

  // Format price with appropriate decimals
  static formatPrice(price: number): string {
    if (price === 0) return '$0.00';
    
    if (price >= 1) {
      return '$' + price.toFixed(2);
    } else if (price >= 0.01) {
      return '$' + price.toFixed(4);
    } else {
      return '$' + price.toFixed(8);
    }
  }
}
