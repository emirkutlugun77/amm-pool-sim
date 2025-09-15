import { Pool, Coin, Transaction } from '../types';

const STORAGE_KEYS = {
  POOLS: 'amm-pools',
  COINS: 'amm-coins',
  TRANSACTIONS: 'amm-transactions',
};

export class StorageManager {
  // Pools
  static savePools(pools: Pool[]): void {
    localStorage.setItem(STORAGE_KEYS.POOLS, JSON.stringify(pools));
  }

  static loadPools(): Pool[] {
    const data = localStorage.getItem(STORAGE_KEYS.POOLS);
    return data ? JSON.parse(data) : [];
  }

  // Coins
  static saveCoins(coins: Coin[]): void {
    localStorage.setItem(STORAGE_KEYS.COINS, JSON.stringify(coins));
  }

  static loadCoins(): Coin[] {
    const data = localStorage.getItem(STORAGE_KEYS.COINS);
    return data ? JSON.parse(data) : this.getDefaultCoins();
  }

  // Transactions
  static saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static loadTransactions(): Transaction[] {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  }

  // Default coins for initial setup
  private static getDefaultCoins(): Coin[] {
    return [
      {
        id: 'usdt',
        name: 'Tether USD',
        symbol: 'USDT',
        color: '#26A17B',
        totalSupply: 1000000000 // 1 milyar USDT
      }
    ];
  }

  // Clear all data
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
