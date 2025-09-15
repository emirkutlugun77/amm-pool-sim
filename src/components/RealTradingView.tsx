import React, { useEffect, useRef } from 'react';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface RealTradingViewProps {
  pool: Pool | null;
}

// TradingView widget declaration
declare global {
  interface Window {
    TradingView: any;
  }
}

export function RealTradingView({ pool }: RealTradingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear container
    containerRef.current.innerHTML = '';

    // Create the widget HTML structure
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '500px';
    widgetContainer.style.width = '100%';

    const widgetContent = document.createElement('div');
    widgetContent.className = 'tradingview-widget-container__widget';
    widgetContent.style.height = '500px';
    widgetContent.style.width = '100%';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;

    const symbol = pool ? `BINANCE:${pool.coinA.symbol}USDT` : 'BINANCE:BTCUSDT';
    
    const config = {
      "autosize": true,
      "symbol": symbol,
      "interval": "1",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#1a1a1a",
      "enable_publishing": false,
      "backgroundColor": "#1a1a1a",
      "gridColor": "#2a2a2a",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "container_id": "tradingview_chart_container"
    };

    script.innerHTML = JSON.stringify(config);

    widgetContainer.appendChild(widgetContent);
    widgetContainer.appendChild(script);
    
    containerRef.current.appendChild(widgetContainer);

    console.log('🚀 TradingView widget loaded for:', symbol);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
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
      {/* AMM Pool Info */}
      <div className="mb-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white">
            {pool.coinA.symbol}/{pool.coinB.symbol} AMM Pool
          </h3>
          <div className="text-right">
            <div className="text-xl font-bold text-white">
              ${currentPrice.toFixed(6)}
            </div>
            <div className={`text-sm font-medium ${
              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">AMM TVL: </span>
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
          <div>
            <span className="text-gray-400">Reserves: </span>
            <span className="text-white font-medium">
              {(pool.reserveA / 1000000).toFixed(1)}M / {(pool.reserveB / 1000).toFixed(0)}K
            </span>
          </div>
        </div>
      </div>

      {/* TradingView Chart */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-3 bg-gray-700 border-b border-gray-600">
          <div className="text-sm font-medium text-white">
            📊 TradingView - {pool.coinA.symbol}USDT Market Chart
          </div>
        </div>
        <div 
          ref={containerRef}
          id="tradingview_chart_container"
          className="w-full"
          style={{ height: '500px', backgroundColor: '#1a1a1a' }}
        />
      </div>
    </div>
  );
}
