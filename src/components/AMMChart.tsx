import React, { useEffect, useRef, useState } from 'react';
import { createChart, Time, ColorType } from 'lightweight-charts';
import { Pool } from '../types';

interface AMMChartProps {
  pool: Pool | null;
}

export function AMMChart({ pool }: AMMChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '1d', label: '1D' },
  ];

  useEffect(() => {
    if (!chartRef.current || !pool) return;

    const chart = createChart(chartRef.current, {
      width: 750, // Küçülttüm swap butonlarına taşmasın
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a1a' },
        textColor: '#ffffff',
      },
      grid: {
        vertLines: { color: '#333333' },
        horzLines: { color: '#333333' },
      },
      rightPriceScale: {
        borderColor: '#333333',
      },
      timeScale: {
        borderColor: '#333333',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    
    // Timeframe'e göre data aggregate et
    const aggregateData = (rawData: any[], timeframe: string) => {
      if (rawData.length === 0) return [];
      
      const getTimeframeDuration = (tf: string) => {
        switch (tf) {
          case '1m': return 60 * 1000;
          case '5m': return 5 * 60 * 1000;
          case '15m': return 15 * 60 * 1000;
          case '1h': return 60 * 60 * 1000;
          case '1d': return 24 * 60 * 60 * 1000;
          default: return 60 * 1000;
        }
      };
      
      const duration = getTimeframeDuration(timeframe);
      const aggregated: any = {};
      
      rawData.forEach(point => {
        const timeKey = Math.floor(point.timestamp / duration) * duration;
        
        if (!aggregated[timeKey]) {
          aggregated[timeKey] = {
            timestamp: timeKey,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
            volume: point.volume
          };
        } else {
          aggregated[timeKey].high = Math.max(aggregated[timeKey].high, point.high);
          aggregated[timeKey].low = Math.min(aggregated[timeKey].low, point.low);
          aggregated[timeKey].close = point.close; // Son fiyat
          aggregated[timeKey].volume += point.volume;
        }
      });
      
      return Object.values(aggregated).sort((a: any, b: any) => a.timestamp - b.timestamp);
    };
    
    const aggregatedData = aggregateData(pool.priceHistory, selectedTimeframe);
    const data = aggregatedData.map((point: any) => ({
      time: Math.floor(point.timestamp / 1000) as Time,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
    }));

    if (data.length > 0) {
      candlestickSeries.setData(data);
      chart.timeScale().fitContent();
    }

    return () => chart.remove();
  }, [pool, selectedTimeframe]); // selectedTimeframe değişince de chart'ı güncelle

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">
          {pool ? `${pool.coinA.symbol}/${pool.coinB.symbol} Chart` : 'Pool Seçin'}
        </h3>
        
        {/* Timeframe Buttons */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe.value}
              onClick={() => setSelectedTimeframe(timeframe.value)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div ref={chartRef} />
      </div>
    </div>
  );
}
