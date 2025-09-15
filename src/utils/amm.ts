import { Pool, SwapQuote } from '../types';

// Constant Product AMM (x * y = k)
export class AMMCalculator {
  private static readonly FEE_RATE = 0.003; // 0.3% fee

  // Calculate output amount for a given input (swap)
  static calculateSwapOutput(
    amountIn: number,
    reserveIn: number,
    reserveOut: number
  ): SwapQuote {
    // Constant Product Formula: x * y = k
    // After swap: (x + amountIn) * (y - amountOut) = k
    // So: amountOut = y - (k / (x + amountIn))
    // Where k = x * y
    
    const k = reserveIn * reserveOut;
    const amountInWithFee = amountIn * (1 - this.FEE_RATE);
    const newReserveIn = reserveIn + amountInWithFee;
    const newReserveOut = k / newReserveIn;
    const amountOut = reserveOut - newReserveOut;

    // Calculate price impact
    const priceBefore = reserveOut / reserveIn;
    const priceAfter = newReserveOut / newReserveIn;
    const priceImpact = Math.abs((priceAfter - priceBefore) / priceBefore) * 100;
    
    const fee = amountIn * this.FEE_RATE;

    return {
      amountIn,
      amountOut,
      priceImpact,
      fee,
      newPrice: priceAfter
    };
  }

  // Calculate input amount needed for a desired output
  static calculateSwapInput(
    amountOut: number,
    reserveIn: number,
    reserveOut: number
  ): number {
    const numerator = reserveIn * amountOut;
    const denominator = (reserveOut - amountOut) * (1 - this.FEE_RATE);
    return numerator / denominator;
  }

  // Calculate price impact percentage (standalone function)
  static calculatePriceImpact(
    amountIn: number,
    reserveIn: number,
    reserveOut: number
  ): number {
    const amountInWithFee = amountIn * (1 - this.FEE_RATE);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    const amountOut = numerator / denominator;
    
    const priceBefore = reserveOut / reserveIn;
    const priceAfter = (reserveOut - amountOut) / (reserveIn + amountIn);
    
    return Math.abs((priceAfter - priceBefore) / priceBefore) * 100;
  }

  // Get current price of token A in terms of token B
  static getCurrentPrice(pool: Pool): number {
    // For TOKEN/USDT pairs, price = USDT_reserve / TOKEN_reserve
    if (pool.coinB.symbol === 'USDT') {
      return pool.reserveB / pool.reserveA;
    }
    // For USDT/TOKEN pairs, price = TOKEN_reserve / USDT_reserve  
    if (pool.coinA.symbol === 'USDT') {
      return pool.reserveB / pool.reserveA;
    }
    // For other pairs
    return pool.reserveB / pool.reserveA;
  }

  // Calculate liquidity provider tokens to mint
  static calculateLPTokensToMint(
    amountA: number,
    amountB: number,
    pool: Pool
  ): number {
    if (pool.lpTokenSupply === 0) {
      // First liquidity provision
      return Math.sqrt(amountA * amountB);
    }

    const liquidityA = (amountA * pool.lpTokenSupply) / pool.reserveA;
    const liquidityB = (amountB * pool.lpTokenSupply) / pool.reserveB;
    
    return Math.min(liquidityA, liquidityB);
  }

  // Calculate tokens to return when burning LP tokens
  static calculateTokensFromLP(
    lpTokenAmount: number,
    pool: Pool
  ): { amountA: number; amountB: number } {
    const share = lpTokenAmount / pool.lpTokenSupply;
    
    return {
      amountA: pool.reserveA * share,
      amountB: pool.reserveB * share
    };
  }

  // Execute swap and update pool reserves
  static executeSwap(
    pool: Pool,
    amountIn: number,
    tokenIn: 'A' | 'B'
  ): { updatedPool: Pool; amountOut: number } {
    const isTokenA = tokenIn === 'A';
    const reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
    const reserveOut = isTokenA ? pool.reserveB : pool.reserveA;

    const quote = this.calculateSwapOutput(amountIn, reserveIn, reserveOut);
    const currentPrice = this.getCurrentPrice(pool);

    // Update reserves first to get the new price correctly
    const newReserveA = isTokenA ? pool.reserveA + amountIn : pool.reserveA - quote.amountOut;
    const newReserveB = isTokenA ? pool.reserveB - quote.amountOut : pool.reserveB + amountIn;
    
    // Calculate new price after swap
    let newPrice;
    if (pool.coinB.symbol === 'USDT') {
      // TOKEN/USDT pair: price = USDT_reserve / TOKEN_reserve
      newPrice = newReserveB / newReserveA;
    } else if (pool.coinA.symbol === 'USDT') {
      // USDT/TOKEN pair: price = USDT_reserve / TOKEN_reserve
      newPrice = newReserveA / newReserveB;
    } else {
      newPrice = newReserveB / newReserveA;
    }

    // Create OHLC data point
    const now = Date.now();
    const lastPricePoint = pool.priceHistory[pool.priceHistory.length - 1];
    
    // Always create new candle for each trade to show activity
    let newPriceHistory = [...pool.priceHistory];
    
    // Calculate volume in USDT terms
    let volumeInUSDT;
    if (isTokenA) {
      // Selling token A for token B
      if (pool.coinB.symbol === 'USDT') {
        volumeInUSDT = quote.amountOut; // Direct USDT amount
      } else {
        volumeInUSDT = amountIn * currentPrice; // Convert to USDT equivalent
      }
    } else {
      // Buying token A with token B
      if (pool.coinB.symbol === 'USDT') {
        volumeInUSDT = amountIn; // Direct USDT amount
      } else {
        volumeInUSDT = quote.amountOut * newPrice; // Convert to USDT equivalent
      }
    }
    
    newPriceHistory.push({
      timestamp: now,
      open: currentPrice,
      high: Math.max(currentPrice, newPrice),
      low: Math.min(currentPrice, newPrice),
      close: newPrice,
      volume: volumeInUSDT
    });

    const updatedPool: Pool = {
      ...pool,
      reserveA: newReserveA,
      reserveB: newReserveB,
      priceHistory: newPriceHistory
    };

    console.log('Swap executed:', {
      tokenIn,
      amountIn,
      amountOut: quote.amountOut,
      priceBefore: currentPrice,
      priceAfter: newPrice,
      newReserves: { A: updatedPool.reserveA, B: updatedPool.reserveB },
      poolType: `${pool.coinA.symbol}/${pool.coinB.symbol}`
    });

    return {
      updatedPool,
      amountOut: quote.amountOut
    };
  }
}
