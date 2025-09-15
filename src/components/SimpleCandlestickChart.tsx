import React, { useMemo } from 'react';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface SimpleCandlestickChartProps {
  pool: Pool | null;
}

export function SimpleCandlestickChart({ pool }: SimpleCandlestickChartProps) {
  const chartData = useMemo(() => {
    if (!pool || !pool.priceHistory.length) {
      console.log('No pool or price history');
      return [];
    }

    console.log('Processing candlestick data:', pool.priceHistory.length, 'points');

    // Convert price history to candlestick data
    const result = pool.priceHistory.map((point, index) => ({
      timestamp: point.timestamp,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
      isGreen: point.close >= point.open
    }));

    console.log('Candlestick data prepared:', result);
    return result;
  }, [pool]);

  const currentPrice = pool ? AMMCalculator.getCurrentPrice(pool) : 0;
  const priceChange = chartData.length > 1 
    ? ((chartData[chartData.length - 1].close - chartData[0].open) / chartData[0].open) * 100 
    : 0;

  if (!pool) {
    return (
      <div className="bg-secondary-800 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-lg">Pool seçin</p>
          <p className="text-sm">Sol taraftan bir pool seçerek mumlu grafiği görüntüleyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-xl font-bold text-white">
              {pool.coinA.symbol}/{pool.coinB.symbol}
            </h3>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-2xl font-bold text-white">
                {currentPrice.toFixed(8)}
              </span>
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  priceChange >= 0
                    ? 'bg-green-900 text-green-300'
                    : 'bg-red-900 text-red-300'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-96 bg-gray-900 rounded-lg p-4 relative">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>Veri yok</p>
              <p className="text-sm">Trading yaparak veri oluşturun</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-end justify-center space-x-1">
            {chartData.map((candle, index) => {
              const maxPrice = Math.max(...chartData.map(c => c.high));
              const minPrice = Math.min(...chartData.map(c => c.low));
              const priceRange = maxPrice - minPrice;
              
              if (priceRange === 0) return null;

              const candleHeight = ((candle.high - candle.low) / priceRange) * 200;
              const bodyHeight = ((Math.abs(candle.close - candle.open)) / priceRange) * 200;
              const bodyTop = ((maxPrice - Math.max(candle.open, candle.close)) / priceRange) * 200;
              const wickTop = ((maxPrice - candle.high) / priceRange) * 200;
              const wickBottom = ((maxPrice - candle.low) / priceRange) * 200;

              return (
                <div key={index} className="flex flex-col items-center relative" style={{ width: '20px' }}>
                  {/* Upper wick */}
                  <div
                    className="w-0.5 absolute"
                    style={{
                      height: `${wickTop}px`,
                      backgroundColor: candle.isGreen ? '#22c55e' : '#ef4444',
                      top: '0px'
                    }}
                  />
                  
                  {/* Candle body */}
                  <div
                    className="w-4 rounded-sm"
                    style={{
                      height: `${Math.max(bodyHeight, 2)}px`,
                      backgroundColor: candle.isGreen ? '#22c55e' : '#ef4444',
                      marginTop: `${bodyTop}px`,
                      border: `1px solid ${candle.isGreen ? '#16a34a' : '#dc2626'}`
                    }}
                  />
                  
                  {/* Lower wick */}
                  <div
                    className="w-0.5 absolute"
                    style={{
                      height: `${wickBottom - (bodyTop + bodyHeight)}px`,
                      backgroundColor: candle.isGreen ? '#22c55e' : '#ef4444',
                      top: `${bodyTop + bodyHeight}px`
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Volume Chart */}
      <div className="h-24 bg-gray-900 rounded-lg p-4 mt-4">
        <div className="h-full flex items-end justify-center space-x-1">
          {chartData.map((candle, index) => {
            const maxVolume = Math.max(...chartData.map(c => c.volume));
            const volumeHeight = maxVolume > 0 ? (candle.volume / maxVolume) * 80 : 0;
            
            return (
              <div
                key={index}
                className="w-4 rounded-sm"
                style={{
                  height: `${Math.max(volumeHeight, 2)}px`,
                  backgroundColor: candle.isGreen ? '#22c55e' : '#ef4444',
                  opacity: 0.7
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-secondary-700">
        <div className="bg-secondary-900 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Open</div>
          <div className="text-sm font-semibold text-white">
            {chartData.length > 0 ? chartData[0].open.toFixed(6) : '0.000000'}
          </div>
        </div>
        
        <div className="bg-secondary-900 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">High</div>
          <div className="text-sm font-semibold text-green-400">
            {chartData.length > 0 ? Math.max(...chartData.map(d => d.high)).toFixed(6) : '0.000000'}
          </div>
        </div>
        
        <div className="bg-secondary-900 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Low</div>
          <div className="text-sm font-semibold text-red-400">
            {chartData.length > 0 ? Math.min(...chartData.map(d => d.low)).toFixed(6) : '0.000000'}
          </div>
        </div>
        
        <div className="bg-secondary-900 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Close</div>
          <div className="text-sm font-semibold text-white">
            {chartData.length > 0 ? chartData[chartData.length - 1].close.toFixed(6) : '0.000000'}
          </div>
        </div>
      </div>
    </div>
  );
}
