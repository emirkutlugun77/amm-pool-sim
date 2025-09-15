import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity } from 'lucide-react';
import { useAMM } from '../contexts/AMMContext';
import { CoinMetricsCalculator } from '../utils/coinMetrics';

export function MarketStats() {
  const { coins, pools, transactions, getCoinMetrics } = useAMM();

  // Calculate total market stats
  const totalMarketCap = coins.reduce((total, coin) => {
    const metrics = getCoinMetrics(coin.id);
    return total + metrics.marketCap;
  }, 0);

  const totalVolume24h = coins.reduce((total, coin) => {
    const metrics = getCoinMetrics(coin.id);
    return total + metrics.volume24h;
  }, 0);

  const totalTVL = pools.reduce((total, pool) => {
    return total + (pool.reserveA + pool.reserveB);
  }, 0);

  const activePools = pools.length;
  const totalTransactions = transactions.length;

  const topGainers = coins
    .map(coin => ({ coin, metrics: getCoinMetrics(coin.id) }))
    .filter(item => item.metrics.price > 0)
    .sort((a, b) => b.metrics.priceChange24h - a.metrics.priceChange24h)
    .slice(0, 3);

  const topLosers = coins
    .map(coin => ({ coin, metrics: getCoinMetrics(coin.id) }))
    .filter(item => item.metrics.price > 0)
    .sort((a, b) => a.metrics.priceChange24h - b.metrics.priceChange24h)
    .slice(0, 3);

  return (
    <div className="bg-secondary-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Market İstatistikleri</h3>
      
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-secondary-900 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign size={18} className="text-primary-400" />
            <span className="text-sm text-gray-400">Total Market Cap</span>
          </div>
          <div className="text-lg font-bold text-white">
            {CoinMetricsCalculator.formatLargeNumber(totalMarketCap)}
          </div>
        </div>

        <div className="bg-secondary-900 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity size={18} className="text-green-400" />
            <span className="text-sm text-gray-400">24h Volume</span>
          </div>
          <div className="text-lg font-bold text-white">
            {CoinMetricsCalculator.formatLargeNumber(totalVolume24h)}
          </div>
        </div>

        <div className="bg-secondary-900 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 size={18} className="text-blue-400" />
            <span className="text-sm text-gray-400">Total TVL</span>
          </div>
          <div className="text-lg font-bold text-white">
            {CoinMetricsCalculator.formatLargeNumber(totalTVL)}
          </div>
        </div>

        <div className="bg-secondary-900 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-primary-500" />
            <span className="text-sm text-gray-400">Active Pools</span>
          </div>
          <div className="text-lg font-bold text-white">{activePools}</div>
        </div>

        <div className="bg-secondary-900 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-400">Total Trades</span>
          </div>
          <div className="text-lg font-bold text-white">{totalTransactions}</div>
        </div>
      </div>

      {/* Top Gainers & Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp size={18} className="text-green-400" />
            <span>En Çok Yükselenler</span>
          </h4>
          <div className="space-y-2">
            {topGainers.length > 0 ? topGainers.map(({ coin, metrics }) => (
              <div key={coin.id} className="flex items-center justify-between p-3 bg-secondary-900 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: coin.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{coin.symbol}</p>
                    <p className="text-xs text-gray-400">{CoinMetricsCalculator.formatPrice(metrics.price)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-400 flex items-center space-x-1">
                    <TrendingUp size={12} />
                    <span>+{metrics.priceChange24h.toFixed(2)}%</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    MC: {CoinMetricsCalculator.formatLargeNumber(metrics.marketCap)}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-sm">Henüz veri yok</p>
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingDown size={18} className="text-red-400" />
            <span>En Çok Düşenler</span>
          </h4>
          <div className="space-y-2">
            {topLosers.length > 0 ? topLosers.map(({ coin, metrics }) => (
              <div key={coin.id} className="flex items-center justify-between p-3 bg-secondary-900 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: coin.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{coin.symbol}</p>
                    <p className="text-xs text-gray-400">{CoinMetricsCalculator.formatPrice(metrics.price)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-400 flex items-center space-x-1">
                    <TrendingDown size={12} />
                    <span>{metrics.priceChange24h.toFixed(2)}%</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    MC: {CoinMetricsCalculator.formatLargeNumber(metrics.marketCap)}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-sm">Henüz veri yok</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
