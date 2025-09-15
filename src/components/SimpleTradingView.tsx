import React, { useEffect, useRef } from 'react';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface SimpleTradingViewProps {
  pool: Pool | null;
}

export function SimpleTradingView({ pool }: SimpleTradingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Create TradingView widget
    const widgetConfig = {
      "width": "100%",
      "height": 500,
      "symbol": pool ? `BINANCE:${pool.coinA.symbol}USDT` : "BINANCE:BTCUSDT",
      "interval": "1",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#1a1a1a",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "container_id": "tradingview_simple_widget"
    };

    // Create script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify(widgetConfig);

    // Add script to container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.appendChild(script);
    
    const widgetDiv = document.createElement('div');
    widgetDiv.id = 'tradingview_simple_widget';
    widgetDiv.style.height = '500px';
    widgetDiv.style.width = '100%';
    
    widgetContainer.appendChild(widgetDiv);
    container.appendChild(widgetContainer);

    console.log('🚀 TradingView widget initialized for symbol:', widgetConfig.symbol);

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
      {/* Header with our AMM data */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
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
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (AMM)
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
            <span className="text-gray-400">AMM Volume: </span>
            <span className="text-white font-medium">
              ${pool.priceHistory.reduce((sum, point) => sum + point.volume, 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">AMM Trades: </span>
            <span className="text-white font-medium">
              {pool.priceHistory.length}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Pool Ratio: </span>
            <span className="text-white font-medium">
              {(pool.reserveA / 1000000).toFixed(1)}M : {(pool.reserveB / 1000).toFixed(0)}K
            </span>
          </div>
        </div>
      </div>

      {/* TradingView Widget */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-3 bg-gray-700 border-b border-gray-600">
          <div className="text-sm text-gray-300">
            📊 <strong>TradingView Market Data</strong> - {pool.coinA.symbol}USDT Real Market Price
          </div>
        </div>
        <div 
          ref={containerRef}
          style={{ height: '500px', width: '100%', backgroundColor: '#1a1a1a' }}
        />
      </div>

      {/* Comparison Note */}
      <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded text-sm">
        <div className="flex items-center space-x-2 text-blue-300">
          <span>💡</span>
          <div>
            <strong>Karşılaştırma:</strong> Üstteki veriler bizim AMM pool'undan, 
            alttaki TradingView grafiği gerçek {pool.coinA.symbol} piyasa verilerini gösteriyor. 
            AMM'mizde {pool.priceHistory.length} trade yapıldı, 
            toplam ${pool.priceHistory.reduce((sum, point) => sum + point.volume, 0).toFixed(2)} volume.
          </div>
        </div>
      </div>
    </div>
  );
}
