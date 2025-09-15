import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface TradingViewLightweightProps {
  pool: Pool | null;
}

export function TradingViewLightweight({ pool }: TradingViewLightweightProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('Creating chart...');

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 100 : 500,
      layout: {
        background: { color: '#1f2937' },
        textColor: '#f1f5f9',
      },
      grid: {
        vertLines: { color: '#374151', style: 1, visible: true },
        horzLines: { color: '#374151', style: 1, visible: true },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758ca3',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: '#758ca3',
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: '#485563',
        entireTextOnly: false,
      },
      timeScale: {
        borderColor: '#485563',
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
    console.log('Chart created');

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    candlestickSeriesRef.current = candlestickSeries;
    console.log('Candlestick series added');

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#6366f1',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeriesRef.current = volumeSeries;
    console.log('Volume series added');

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
          height: isFullscreen ? window.innerHeight - 100 : 500
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
    if (!chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current || !pool) return;

    console.log('Updating chart with pool:', pool.id, 'priceHistory:', pool.priceHistory.length);

    // Prepare data
    const chartData: CandlestickData[] = [];
    const volumeData: any[] = [];
    
    // Use price history directly
    pool.priceHistory.forEach((point, index) => {
      console.log('Adding point:', point);
      chartData.push({
        time: (point.timestamp / 1000) as Time,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      });

      volumeData.push({
        time: (point.timestamp / 1000) as Time,
        value: point.volume,
        color: point.close >= point.open ? '#22c55e' : '#ef4444',
      });
    });

    // If no data, create a default point
    if (chartData.length === 0) {
      const currentPrice = AMMCalculator.getCurrentPrice(pool);
      const now = Date.now();
      
      console.log('No data, creating default point with price:', currentPrice);
      
      chartData.push({
        time: (now / 1000) as Time,
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
      });

      volumeData.push({
        time: (now / 1000) as Time,
        value: 0,
        color: '#6366f1',
      });
    }

    console.log('Chart data prepared:', chartData.length, 'candles,', volumeData.length, 'volume bars');

    // Set data
    try {
      candlestickSeriesRef.current.setData(chartData);
      volumeSeriesRef.current.setData(volumeData);

      // Fit content
      chartRef.current.timeScale().fitContent();
      
      console.log('Chart data set successfully');
    } catch (e) {
      console.error('Chart data update error:', e);
    }

  }, [pool]);

  if (!pool) {
    return (
      <div className="bg-secondary-800 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-lg">Pool seçin</p>
          <p className="text-sm">Sol taraftan bir pool seçerek TradingView grafiğini görüntüleyin</p>
        </div>
      </div>
    );
  }

  const currentPrice = AMMCalculator.getCurrentPrice(pool);
  const priceChange = pool.priceHistory.length > 1 
    ? ((pool.priceHistory[pool.priceHistory.length - 1].close - pool.priceHistory[0].open) / pool.priceHistory[0].open) * 100 
    : 0;

  return (
    <div className={`bg-secondary-800 rounded-lg ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-700">
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
                {currentPrice.toFixed(8)}
              </span>
              <span
                className={`px-2 py-1 rounded text-sm font-medium flex items-center space-x-1 ${
                  priceChange >= 0
                    ? 'bg-green-900 text-green-300'
                    : 'bg-red-900 text-red-300'
                }`}
              >
                <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-4 text-xs text-gray-400 mr-4">
            <div>TVL: ${(pool.reserveA + pool.reserveB).toFixed(2)}</div>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-secondary-700 rounded transition-colors"
          >
            {isFullscreen ? 'Minimize' : 'Maximize'}
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full"
        style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '500px' }}
      />

      {/* Bottom Stats */}
      <div className="flex items-center justify-between p-4 border-t border-secondary-700 text-xs text-gray-400">
        <div className="flex items-center space-x-6">
          <div>O: {pool.priceHistory[0]?.open.toFixed(8) || '0.00000000'}</div>
          <div className="text-green-400">H: {Math.max(...pool.priceHistory.map(p => p.high)).toFixed(8)}</div>
          <div className="text-red-400">L: {Math.min(...pool.priceHistory.map(p => p.low)).toFixed(8)}</div>
          <div>C: {currentPrice.toFixed(8)}</div>
        </div>
        <div className="flex items-center space-x-4">
          <div>Powered by TradingView Lightweight Charts</div>
          <div>{new Date().toLocaleTimeString('tr-TR')}</div>
        </div>
      </div>
    </div>
  );
}
