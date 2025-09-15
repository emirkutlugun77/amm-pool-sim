import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Pool, TimeFrame } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Volume2,
  Settings,
  Maximize,
  Minimize
} from 'lucide-react';

interface ProfessionalTradingChartProps {
  pool: Pool | null;
}

const TIME_FRAMES: TimeFrame[] = [
  { value: '1s', label: '1s', interval: 1000 },
  { value: '1m', label: '1m', interval: 60000 },
  { value: '5m', label: '5m', interval: 300000 },
  { value: '15m', label: '15m', interval: 900000 },
  { value: '1h', label: '1h', interval: 3600000 },
  { value: '4h', label: '4h', interval: 14400000 },
  { value: '1d', label: '1D', interval: 86400000 },
];

export function ProfessionalTradingChart({ pool }: ProfessionalTradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>('1m');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create main chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 100 : 500,
      layout: {
        background: { color: '#0f172a' },
        textColor: '#f1f5f9',
      },
      grid: {
        vertLines: { color: '#1e293b', style: 1, visible: true },
        horzLines: { color: '#1e293b', style: 1, visible: true },
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
        secondsVisible: selectedTimeFrame.includes('s'),
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
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
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
    try {
      chart.priceScale('').applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });
    } catch (e) {
      // Ignore scale errors
    }

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
  }, [selectedTimeFrame, isFullscreen]);

  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current || !pool) return;

    // Prepare data
    const timeFrame = TIME_FRAMES.find(tf => tf.value === selectedTimeFrame);
    if (!timeFrame) return;

    const chartData: CandlestickData[] = [];
    const volumeData: any[] = [];
    const now = Date.now();
    const startTime = now - (100 * timeFrame.interval);

    // Group data by time intervals
    const groupedData: { [key: number]: typeof pool.priceHistory } = {};
    
    for (let i = 0; i < 100; i++) {
      const slotTime = Math.floor((startTime + i * timeFrame.interval) / timeFrame.interval) * timeFrame.interval;
      groupedData[slotTime] = [];
    }

    pool.priceHistory.forEach(point => {
      const slotTime = Math.floor(point.timestamp / timeFrame.interval) * timeFrame.interval;
      if (groupedData[slotTime]) {
        groupedData[slotTime].push(point);
      }
    });

    // Convert to chart format
    Object.keys(groupedData).forEach(timeKey => {
      const time = parseInt(timeKey);
      const points = groupedData[time];
      
      if (points.length === 0) {
        const prevClose = chartData.length > 0 
          ? chartData[chartData.length - 1].close 
          : pool.reserveB / pool.reserveA;
          
        chartData.push({
          time: (time / 1000) as Time,
          open: prevClose,
          high: prevClose,
          low: prevClose,
          close: prevClose,
        });

        volumeData.push({
          time: (time / 1000) as Time,
          value: 0,
          color: '#6366f1',
        });
      } else {
        const totalVolume = points.reduce((sum, p) => sum + p.volume, 0);
        const isGreen = points[points.length - 1].close >= points[0].open;

        chartData.push({
          time: (time / 1000) as Time,
          open: points[0].open,
          high: Math.max(...points.map(p => p.high)),
          low: Math.min(...points.map(p => p.low)),
          close: points[points.length - 1].close,
        });

        volumeData.push({
          time: (time / 1000) as Time,
          value: totalVolume,
          color: isGreen ? '#22c55e' : '#ef4444',
        });
      }
    });

    // Set data
    try {
      candlestickSeriesRef.current.setData(chartData);
      volumeSeriesRef.current.setData(volumeData);

      // Fit content
      chartRef.current.timeScale().fitContent();
    } catch (e) {
      console.log('Chart data update error:', e);
    }

  }, [pool, selectedTimeFrame]);

  if (!pool) {
    return (
      <div className="bg-secondary-900 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-lg">Pool seçin</p>
          <p className="text-sm">Sol taraftan bir pool seçerek profesyonel grafiği görüntüleyin</p>
        </div>
      </div>
    );
  }

  const currentPrice = pool.reserveB / pool.reserveA;
  const priceChange = pool.priceHistory.length > 1 
    ? ((currentPrice - pool.priceHistory[0].open) / pool.priceHistory[0].open) * 100 
    : 0;

  return (
    <div className={`bg-secondary-900 rounded-lg ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
      {/* TradingView Style Header */}
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
                {priceChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
              </span>
            </div>
          </div>

          {/* Time Frame Buttons */}
          <div className="flex bg-secondary-800 rounded-lg p-1">
            {TIME_FRAMES.map((timeFrame) => (
              <button
                key={timeFrame.value}
                onClick={() => setSelectedTimeFrame(timeFrame.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedTimeFrame === timeFrame.value
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-secondary-700'
                }`}
              >
                {timeFrame.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-4 text-xs text-gray-400 mr-4">
            <div className="flex items-center space-x-1">
              <Volume2 size={14} />
              <span>Vol: {pool.priceHistory.reduce((sum, p) => sum + p.volume, 0).toFixed(2)}</span>
            </div>
            <div>TVL: ${(pool.reserveA + pool.reserveB).toFixed(2)}</div>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-secondary-700 rounded transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          <button className="p-2 text-gray-400 hover:text-white hover:bg-secondary-700 rounded transition-colors">
            <Settings size={16} />
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
          <div>Powered by AMM DEX</div>
          <div>{new Date().toLocaleTimeString('tr-TR')}</div>
        </div>
      </div>
    </div>
  );
}
