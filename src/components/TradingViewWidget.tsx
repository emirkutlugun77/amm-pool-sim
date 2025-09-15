import React, { useEffect, useRef } from 'react';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface TradingViewWidgetProps {
  pool: Pool | null;
}

export function TradingViewWidget({ pool }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Load TradingView widget script
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: pool ? `CRYPTO:${pool.coinA.symbol}${pool.coinB.symbol}` : "CRYPTO:BTCUSDT",
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      withdateranges: true,
      range: "1D",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: true,
      hotlist: true,
      calendar: false,
      studies: [
        "Volume@tv-basicstudies"
      ],
      container_id: "tradingview_widget"
    });

    script.onload = () => {
      console.log('✅ TradingView widget loaded successfully');
    };

    script.onerror = () => {
      console.error('❌ Failed to load TradingView widget script');
    };

    // Clear previous widget and add new script
    container.innerHTML = '';
    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [pool]);

  if (!pool) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-lg font-semibold">Pool Seçin</p>
          <p className="text-sm">Sol panelden bir pool seçerek TradingView grafiğini görüntüleyin</p>
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

      {/* TradingView Widget */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div 
          ref={containerRef}
          id="tradingview_widget"
          style={{ height: '500px', width: '100%' }}
        />
      </div>

      {/* Our Data vs TradingView Note */}
      <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded text-sm">
        <div className="flex items-center space-x-2 text-blue-300">
          <span>ℹ️</span>
          <span>
            <strong>Not:</strong> TradingView gerçek piyasa verilerini gösterir. 
            Bizim AMM verilerimiz: {pool.priceHistory.length} trade, 
            ${pool.priceHistory.reduce((sum, point) => sum + point.volume, 0).toFixed(2)} volume
          </span>
        </div>
      </div>
    </div>
  );
}
