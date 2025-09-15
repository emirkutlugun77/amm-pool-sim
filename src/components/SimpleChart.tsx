import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, Time } from 'lightweight-charts';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface SimpleChartProps {
  pool: Pool | null;
}

export function SimpleChart({ pool }: SimpleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Initialize and update chart whenever pool changes
  useEffect(() => {
    if (!pool || !chartContainerRef.current) {
      console.log('❌ Missing requirements:', { pool: !!pool, container: !!chartContainerRef.current });
      return;
    }

    console.log('🚀 Creating new chart for pool:', pool.id);

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a1a' },
        textColor: '#ffffff',
      },
      width: chartContainerRef.current.clientWidth || 800,
      height: 400,
      grid: {
        vertLines: { color: '#2a2a2a' },
        horzLines: { color: '#2a2a2a' },
      },
      rightPriceScale: {
        borderColor: '#485563',
      },
      timeScale: {
        borderColor: '#485563',
        timeVisible: true,
      },
    });

    // Add line series
    const lineSeries = chart.addLineSeries({
      color: '#00d4aa',
      lineWidth: 2,
    });

    console.log('✅ Chart and series created');

    // Prepare chart data
    const chartData: Array<{ time: Time; value: number }> = [];

    console.log('📊 Processing pool data:', {
      poolId: pool.id,
      priceHistoryLength: pool.priceHistory.length,
      priceHistory: pool.priceHistory
    });

    // Convert price history to chart data
    if (pool.priceHistory && pool.priceHistory.length > 0) {
      pool.priceHistory.forEach((point, index) => {
        if (point.close > 0) {
          const dataPoint = {
            time: Math.floor(point.timestamp / 1000) as Time,
            value: point.close,
          };
          chartData.push(dataPoint);
          console.log(`📍 Added point ${index}:`, dataPoint);
        }
      });
    }

    // Add default point if no data
    if (chartData.length === 0) {
      const currentPrice = AMMCalculator.getCurrentPrice(pool);
      if (currentPrice > 0) {
        const defaultPoint = {
          time: Math.floor(Date.now() / 1000) as Time,
          value: currentPrice,
        };
        chartData.push(defaultPoint);
        console.log('➕ Added default point:', defaultPoint);
      }
    }

    console.log('📋 Final chart data:', chartData);

    // Set data and fit content
    if (chartData.length > 0) {
      try {
        lineSeries.setData(chartData);
        chart.timeScale().fitContent();
        console.log('✅ Chart data set successfully!');
      } catch (error) {
        console.error('❌ Error setting chart data:', error);
      }
    } else {
      console.log('⚠️ No valid chart data to display');
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up chart');
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [pool]); // Re-run whenever pool changes

  if (!pool) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-lg font-semibold">Pool Seçin</p>
          <p className="text-sm">Sol panelden bir pool seçerek grafiği görüntüleyin</p>
        </div>
      </div>
    );
  }

  const currentPrice = AMMCalculator.getCurrentPrice(pool);
  const priceChange = pool.priceHistory.length > 1 
    ? ((pool.priceHistory[pool.priceHistory.length - 1].close - pool.priceHistory[0].open) / pool.priceHistory[0].open) * 100 
    : 0;

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">
            {pool.coinA.symbol}/{pool.coinB.symbol}
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              ${currentPrice.toFixed(6)}
            </div>
            <div className={`text-sm font-medium ${
              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">TVL: </span>
            <span className="text-white font-medium">
              ${(pool.reserveA * currentPrice + pool.reserveB).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Volume: </span>
            <span className="text-white font-medium">
              ${pool.priceHistory.reduce((sum, point) => sum + point.volume, 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Trades: </span>
            <span className="text-white font-medium">
              {pool.priceHistory.length}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-96 bg-gray-800 rounded-lg border border-gray-700"
        style={{ minHeight: '400px' }}
      />

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400 space-y-1">
        <div><strong className="text-yellow-400">🔍 CHART DEBUG:</strong></div>
        <div>Pool: {pool.coinA.symbol}/{pool.coinB.symbol} (ID: {pool.id})</div>
        <div>Price History: {pool.priceHistory.length} points</div>
        <div>Current Price: ${currentPrice.toFixed(8)}</div>
        <div>Reserves: {pool.reserveA.toFixed(2)} {pool.coinA.symbol} / {pool.reserveB.toFixed(2)} {pool.coinB.symbol}</div>
        <div>Container: {chartContainerRef.current ? '✅ Ready' : '❌ Not Ready'}</div>
        <div className="text-white">
          <strong>📊 Recent Trades:</strong>
          {pool.priceHistory.slice(-3).map((point, i) => (
            <div key={i} className="ml-2">
              #{pool.priceHistory.length - 3 + i + 1}: ${point.close.toFixed(8)} (Vol: ${point.volume.toFixed(2)})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}