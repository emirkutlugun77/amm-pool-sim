import React from 'react';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface TradingViewIframeProps {
  pool: Pool | null;
}

export function TradingViewIframe({ pool }: TradingViewIframeProps) {
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

  // TradingView iframe URL
  const symbol = `BINANCE:${pool.coinA.symbol}USDT`;
  const tradingViewUrl = `https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(symbol)}&interval=1&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=1a1a1a&studies=%5B%5D&hideideas=1&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%22paneProperties.background%22%3A%22%231a1a1a%22%2C%22paneProperties.vertGridProperties.color%22%3A%22%232a2a2a%22%2C%22paneProperties.horzGridProperties.color%22%3A%22%232a2a2a%22%2C%22symbolWatermarkProperties.transparency%22%3A90%2C%22scalesProperties.textColor%22%3A%22%23ffffff%22%7D&enabled_features=%5B%5D&disabled_features=%5B%22use_localstorage_for_settings%22%5D&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart&utm_term=${encodeURIComponent(symbol)}`;

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
            📊 TradingView Chart - {symbol}
          </div>
        </div>
        <div className="relative" style={{ height: '500px' }}>
          <iframe
            id="tradingview_chart"
            src={tradingViewUrl}
            style={{
              width: '100%',
              height: '500px',
              border: 'none',
              backgroundColor: '#1a1a1a'
            }}
            frameBorder="0"
            allowTransparency={true}
            scrolling="no"
            allowFullScreen={true}
            title={`TradingView Chart for ${symbol}`}
          />
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-green-900 bg-opacity-20 border border-green-700 rounded text-sm">
        <div className="flex items-center space-x-2 text-green-300">
          <span>✅</span>
          <div>
            <strong>TradingView Grafiği Yüklendi!</strong> 
            {pool.coinA.symbol}USDT çiftinin gerçek piyasa verilerini gösteriyor. 
            AMM pool'unda {pool.priceHistory.length} trade yapıldı, 
            toplam ${pool.priceHistory.reduce((sum, point) => sum + point.volume, 0).toFixed(2)} volume.
          </div>
        </div>
      </div>
    </div>
  );
}
