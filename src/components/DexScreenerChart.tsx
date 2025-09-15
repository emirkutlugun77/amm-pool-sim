import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';
import { TrendingUp, TrendingDown, Volume2, BarChart3, Settings, Maximize, Minimize } from 'lucide-react';

interface DexScreenerChartProps {
  pool: Pool | null;
}

export function DexScreenerChart({ pool }: DexScreenerChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1D' },
  ];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 100 : 600,
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#ffffff',
      },
      grid: {
        vertLines: { color: '#1a1a1a', style: 1, visible: true },
        horzLines: { color: '#1a1a1a', style: 1, visible: true },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#666666',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: '#666666',
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: '#333333',
        entireTextOnly: false,
      },
      timeScale: {
        borderColor: '#333333',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00d4aa',
      downColor: '#ff6b6b',
      borderDownColor: '#ff6b6b',
      borderUpColor: '#00d4aa',
      wickDownColor: '#ff6b6b',
      wickUpColor: '#00d4aa',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#6366f1',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeriesRef.current = volumeSeries;

    // Set volume series scale
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : 600
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current || !pool) {
      console.log('Chart update skipped - missing dependencies:', {
        chart: !!chartRef.current,
        candlestick: !!candlestickSeriesRef.current,
        volume: !!volumeSeriesRef.current,
        pool: !!pool
      });
      return;
    }

    console.log('Updating DexScreener chart with pool:', pool.id, 'priceHistory length:', pool.priceHistory.length);
    console.log('Pool price history:', pool.priceHistory);

    // Prepare data
    const chartData: CandlestickData[] = [];
    const volumeData: any[] = [];
    
    // Use price history directly
    if (pool.priceHistory && pool.priceHistory.length > 0) {
      pool.priceHistory.forEach((point, index) => {
        console.log('Adding chart point:', point);
        
        // Ensure all values are valid numbers
        if (point.open > 0 && point.high > 0 && point.low > 0 && point.close > 0) {
          chartData.push({
            time: (Math.floor(point.timestamp / 1000)) as Time,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
          });

          volumeData.push({
            time: (Math.floor(point.timestamp / 1000)) as Time,
            value: point.volume || 0,
            color: point.close >= point.open ? '#00d4aa' : '#ff6b6b',
          });
        }
      });
    }

    // Always ensure at least one data point exists
    if (chartData.length === 0) {
      const currentPrice = AMMCalculator.getCurrentPrice(pool);
      const now = Date.now();
      
      console.log('No valid chart data, creating default point with price:', currentPrice);
      
      if (currentPrice > 0) {
        chartData.push({
          time: (Math.floor(now / 1000)) as Time,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
        });

        volumeData.push({
          time: (Math.floor(now / 1000)) as Time,
          value: 0,
          color: '#6366f1',
        });
      }
    }

    console.log('Setting chart data:', chartData.length, 'candles,', volumeData.length, 'volume bars');
    console.log('Chart data preview:', chartData.slice(0, 3));

    // Set data
    try {
      if (chartData.length > 0) {
        candlestickSeriesRef.current.setData(chartData);
        volumeSeriesRef.current.setData(volumeData);
        
        // Fit content with some padding
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
            console.log('Chart fitted to content');
          }
        }, 100);
        
        console.log('Chart data set successfully');
      } else {
        console.warn('No valid chart data to display');
      }
    } catch (e) {
      console.error('Chart data update error:', e);
    }

  }, [pool]);

  if (!pool) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-lg">Pool seçin</p>
          <p className="text-sm">Sol taraftan bir pool seçerek DexScreener grafiğini görüntüleyin</p>
        </div>
      </div>
    );
  }

  const currentPrice = AMMCalculator.getCurrentPrice(pool);
  const priceChange = pool.priceHistory.length > 1 
    ? ((pool.priceHistory[pool.priceHistory.length - 1].close - pool.priceHistory[0].open) / pool.priceHistory[0].open) * 100 
    : 0;

  const volume24h = pool.priceHistory.reduce((sum, p) => sum + p.volume, 0);
  const tvl = pool.reserveA + pool.reserveB;

  return (
    <div className={`bg-gray-900 rounded-lg ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
      {/* DexScreener Style Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-6">
          {/* Symbol & Price */}
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>{pool.coinA.symbol}/{pool.coinB.symbol}</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: pool.coinA.color }}
              />
            </h3>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-xl font-bold text-white">
                ${currentPrice.toFixed(8)}
              </span>
              <span
                className={`px-2 py-1 rounded text-sm font-medium flex items-center space-x-1 ${
                  priceChange >= 0
                    ? 'bg-green-900 text-green-300'
                    : 'bg-red-900 text-red-300'
                }`}
              >
                {priceChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
              </span>
            </div>
          </div>

          {/* Time Frame Buttons */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => setSelectedTimeframe(timeframe.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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

        {/* Chart Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-4 text-xs text-gray-400 mr-4">
            <div className="flex items-center space-x-1">
              <Volume2 size={14} />
              <span>Vol: {volume24h.toFixed(2)}</span>
            </div>
            <div>TVL: ${tvl.toFixed(2)}</div>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full"
        style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '600px' }}
      />

      {/* Bottom Stats */}
      <div className="flex items-center justify-between p-4 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center space-x-6">
          <div>O: ${pool.priceHistory[0]?.open.toFixed(8) || '0.00000000'}</div>
          <div className="text-green-400">H: ${Math.max(...pool.priceHistory.map(p => p.high)).toFixed(8)}</div>
          <div className="text-red-400">L: ${Math.min(...pool.priceHistory.map(p => p.low)).toFixed(8)}</div>
          <div>C: ${currentPrice.toFixed(8)}</div>
        </div>
        <div className="flex items-center space-x-4">
          <div>Powered by AMM DEX</div>
          <div>{new Date().toLocaleTimeString('tr-TR')}</div>
        </div>
      </div>
    </div>
  );
}
