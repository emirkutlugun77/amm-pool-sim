import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Pool, Coin, Transaction, SwapQuote } from '../types';
import { StorageManager } from '../utils/storage';
import { AMMCalculator } from '../utils/amm';
import { useRealTimePrice } from '../hooks/useRealTimePrice';
import { CoinMetricsCalculator, CoinMetrics } from '../utils/coinMetrics';

interface AMMContextType {
  coins: Coin[];
  pools: Pool[];
  transactions: Transaction[];
  selectedPool: Pool | null;
  loading: boolean;
  createPool: (coinAId: string, coinBId: string, reserveA: number, reserveB: number) => void;
  executeSwap: (poolId: string, amountIn: number, tokenIn: 'A' | 'B') => void;
  getSwapQuote: (poolId: string, amountIn: number, tokenIn: 'A' | 'B') => SwapQuote | null;
  undoLastTransaction: () => boolean;
  canUndo: boolean;
  createCoin: (name: string, symbol: string, color: string, totalSupply: number) => void;
  deleteCoin: (coinId: string) => void;
  resetAllData: () => void;
  getCoinMetrics: (coinId: string) => CoinMetrics;
  selectPool: (pool: Pool | null) => void;
}

interface AMMState {
  pools: Pool[];
  coins: Coin[];
  transactions: Transaction[];
  selectedPool: Pool | null;
  loading: boolean;
}

type AMMAction =
  | { type: 'SET_POOLS'; payload: Pool[] }
  | { type: 'ADD_POOL'; payload: Pool }
  | { type: 'UPDATE_POOL'; payload: Pool }
  | { type: 'SET_COINS'; payload: Coin[] }
  | { type: 'ADD_COIN'; payload: Coin }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SELECT_POOL'; payload: Pool | null }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AMMState = {
  pools: [],
  coins: [],
  transactions: [],
  selectedPool: null,
  loading: true,
};

function ammReducer(state: AMMState, action: AMMAction): AMMState {
  switch (action.type) {
    case 'SET_POOLS':
      return { ...state, pools: action.payload };
    case 'ADD_POOL':
      return { ...state, pools: [...state.pools, action.payload] };
    case 'UPDATE_POOL':
      return {
        ...state,
        pools: state.pools.map(pool =>
          pool.id === action.payload.id ? action.payload : pool
        ),
        selectedPool: state.selectedPool?.id === action.payload.id ? action.payload : state.selectedPool
      };
    case 'SET_COINS':
      return { ...state, coins: action.payload };
    case 'ADD_COIN':
      return { ...state, coins: [...state.coins, action.payload] };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'SELECT_POOL':
      return { ...state, selectedPool: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

const AMMContext = createContext<AMMContextType | undefined>(undefined);

export function AMMProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(ammReducer, initialState);

  // Real-time price updates for selected pool
  const handlePriceUpdate = (updatedPool: Pool) => {
    dispatch({ type: 'UPDATE_POOL', payload: updatedPool });
  };

  useRealTimePrice(state.selectedPool, handlePriceUpdate);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const coins = StorageManager.loadCoins();
      const pools = StorageManager.loadPools();
      const transactions = StorageManager.loadTransactions();
      
      dispatch({ type: 'SET_COINS', payload: coins });
      dispatch({ type: 'SET_POOLS', payload: pools });
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    loadData();
  }, []);

  // Save data when state changes
  useEffect(() => {
    if (!state.loading) {
      StorageManager.savePools(state.pools);
    }
  }, [state.pools, state.loading]);

  useEffect(() => {
    if (!state.loading) {
      StorageManager.saveCoins(state.coins);
    }
  }, [state.coins, state.loading]);

  useEffect(() => {
    if (!state.loading) {
      StorageManager.saveTransactions(state.transactions);
    }
  }, [state.transactions, state.loading]);

  const createPool = (coinAId: string, coinBId: string, reserveA: number, reserveB: number) => {
    const coinA = state.coins.find(c => c.id === coinAId);
    const coinB = state.coins.find(c => c.id === coinBId);
    
    if (!coinA || !coinB) {
      throw new Error('Coins not found');
    }

    // Calculate initial price correctly for TOKEN/USDT pairs
    let initialPrice;
    if (coinB.symbol === 'USDT') {
      // TOKEN/USDT: price = USDT_amount / TOKEN_amount
      initialPrice = reserveB / reserveA;
    } else if (coinA.symbol === 'USDT') {
      // USDT/TOKEN: price = USDT_amount / TOKEN_amount
      initialPrice = reserveA / reserveB;
    } else {
      // Other pairs
      initialPrice = reserveB / reserveA;
    }
    
    console.log('🏗️ Creating pool:', {
      coinA: coinA.symbol,
      coinB: coinB.symbol,
      reserveA,
      reserveB,
      initialPrice
    });

    const newPool: Pool = {
      id: `${coinAId}-${coinBId}-${Date.now()}`,
      coinA,
      coinB,
      reserveA,
      reserveB,
      lpTokenSupply: Math.sqrt(reserveA * reserveB),
      createdAt: Date.now(),
      priceHistory: [
        {
          timestamp: Date.now(),
          open: initialPrice,
          high: initialPrice,
          low: initialPrice,
          close: initialPrice,
          volume: 0
        }
      ]
    };

    console.log('✅ Pool created with price history:', newPool.priceHistory);

    dispatch({ type: 'ADD_POOL', payload: newPool });
    
    // Auto-select the new pool
    dispatch({ type: 'SELECT_POOL', payload: newPool });
  };

  const executeSwap = (poolId: string, amountIn: number, tokenIn: 'A' | 'B') => {
    const pool = state.pools.find(p => p.id === poolId);
    if (!pool) return;

    console.log('Executing swap:', { poolId, amountIn, tokenIn, poolBefore: pool });

    const { updatedPool, amountOut } = AMMCalculator.executeSwap(pool, amountIn, tokenIn);
    
    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      poolId,
      type: tokenIn === 'A' ? 'sell' : 'buy',
      amountIn,
      amountOut,
      tokenIn: tokenIn === 'A' ? pool.coinA.symbol : pool.coinB.symbol,
      tokenOut: tokenIn === 'A' ? pool.coinB.symbol : pool.coinA.symbol,
      timestamp: Date.now(),
      price: AMMCalculator.getCurrentPrice(updatedPool)
    };

    console.log('Swap completed:', { 
      transaction, 
      poolAfter: updatedPool,
      priceChange: AMMCalculator.getCurrentPrice(updatedPool) - AMMCalculator.getCurrentPrice(pool)
    });

    dispatch({ type: 'UPDATE_POOL', payload: updatedPool });
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  };

  const getSwapQuote = (poolId: string, amountIn: number, tokenIn: 'A' | 'B'): SwapQuote | null => {
    const pool = state.pools.find(p => p.id === poolId);
    if (!pool) return null;

    const reserveIn = tokenIn === 'A' ? pool.reserveA : pool.reserveB;
    const reserveOut = tokenIn === 'A' ? pool.reserveB : pool.reserveA;

    return AMMCalculator.calculateSwapOutput(amountIn, reserveIn, reserveOut);
  };

  const createCoin = (name: string, symbol: string, color: string, totalSupply: number) => {
    const newCoin: Coin = {
      id: symbol.toLowerCase() + '-' + Date.now(),
      name,
      symbol: symbol.toUpperCase(),
      color,
      totalSupply
    };

    dispatch({ type: 'ADD_COIN', payload: newCoin });
  };

  const deleteCoin = (coinId: string) => {
    // Check if coin has any active pools
    const coinPools = state.pools.filter(pool => 
      pool.coinA.id === coinId || pool.coinB.id === coinId
    );

    if (coinPools.length > 0) {
      throw new Error('Bu coin\'e ait aktif poollar var. Önce poolları silin.');
    }

    // Remove coin
    const updatedCoins = state.coins.filter(coin => coin.id !== coinId);
    dispatch({ type: 'SET_COINS', payload: updatedCoins });

    // Remove any transactions related to this coin
    const updatedTransactions = state.transactions.filter(tx => 
      tx.tokenIn !== state.coins.find(c => c.id === coinId)?.symbol &&
      tx.tokenOut !== state.coins.find(c => c.id === coinId)?.symbol
    );
    dispatch({ type: 'SET_TRANSACTIONS', payload: updatedTransactions });
  };

  const resetAllData = () => {
    console.log('🔄 Resetting all data...');
    
    // Reset to initial state with only USDT
    const usdtCoin: Coin = {
      id: 'usdt-initial',
      name: 'Tether USD',
      symbol: 'USDT',
      color: '#26a69a',
      totalSupply: 1000000000 // 1 billion USDT
    };

    // Clear localStorage
    StorageManager.saveCoins([usdtCoin]);
    StorageManager.savePools([]);
    StorageManager.saveTransactions([]);

    // Update state
    dispatch({ type: 'SET_COINS', payload: [usdtCoin] });
    dispatch({ type: 'SET_POOLS', payload: [] });
    dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
    dispatch({ type: 'SELECT_POOL', payload: null });

    console.log('✅ All data reset successfully');
  };

  const selectPool = (pool: Pool | null) => {
    dispatch({ type: 'SELECT_POOL', payload: pool });
  };

  const undoLastTransaction = (): boolean => {
    if (state.transactions.length === 0) {
      console.log('❌ No transactions to undo');
      return false;
    }

    const lastTransaction = state.transactions[state.transactions.length - 1];
    const pool = state.pools.find(p => p.id === lastTransaction.poolId);
    
    if (!pool) {
      console.log('❌ Pool not found for undo');
      return false;
    }

    console.log('🔄 Undoing transaction:', lastTransaction);

    // Get the state before the last transaction
    // We need to reverse the reserves and price history
    const originalReserves = {
      A: lastTransaction.type === 'buy' 
        ? pool.reserveA + lastTransaction.amountIn  // Add back what was taken
        : pool.reserveA - lastTransaction.amountOut, // Remove what was added
      B: lastTransaction.type === 'buy'
        ? pool.reserveB - lastTransaction.amountOut // Remove what was added
        : pool.reserveB + lastTransaction.amountIn   // Add back what was taken
    };

    console.log('🔄 Restoring reserves:', {
      from: { A: pool.reserveA, B: pool.reserveB },
      to: originalReserves
    });

    // Remove the last price history entry
    const restoredPriceHistory = pool.priceHistory.slice(0, -1);

    // Create restored pool
    const restoredPool: Pool = {
      ...pool,
      reserveA: originalReserves.A,
      reserveB: originalReserves.B,
      priceHistory: restoredPriceHistory
    };

    // Update the pool and remove the last transaction
    dispatch({ type: 'UPDATE_POOL', payload: restoredPool });
    dispatch({ 
      type: 'SET_TRANSACTIONS', 
      payload: state.transactions.slice(0, -1)
    });

    console.log('✅ Transaction undone successfully');
    return true;
  };

  const canUndo = state.transactions.length > 0;

  const getCoinMetrics = (coinId: string): CoinMetrics => {
    const coin = state.coins.find(c => c.id === coinId);
    if (!coin) {
      console.log('Coin not found for ID:', coinId);
      return {
        price: 0,
        marketCap: 0,
        fdv: 0,
        volume24h: 0,
        priceChange24h: 0,
        circulatingSupply: 0
      };
    }

    console.log('Calculating metrics for coin:', coin.symbol, 'with pools:', state.pools.length, 'transactions:', state.transactions.length);
    const metrics = CoinMetricsCalculator.calculateMetrics(coin, state.pools, state.transactions);
    console.log('Calculated metrics:', metrics);
    
    return metrics;
  };

  return (
    <AMMContext.Provider
      value={{
        ...state,
        createPool,
        executeSwap,
        getSwapQuote,
        undoLastTransaction,
        canUndo,
        createCoin,
        deleteCoin,
        resetAllData,
        getCoinMetrics,
        selectPool,
      }}
    >
      {children}
    </AMMContext.Provider>
  );
}

export function useAMM() {
  const context = useContext(AMMContext);
  if (context === undefined) {
    throw new Error('useAMM must be used within an AMMProvider');
  }
  return context;
}
