import React, { useEffect, useRef } from 'react';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface ProfessionalTradingViewProps {
  pool: Pool | null;
}

// TradingView Widget API
declare global {
  interface Window {
    TradingView: any;
  }
}

export function ProfessionalTradingView({ pool }: ProfessionalTradingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        createWidget();
      };
      document.head.appendChild(script);
    } else {
      createWidget();
    }

    function createWidget() {
      if (!containerRef.current || !window.TradingView) return;

      // Map our custom coins to real symbols
      const getSymbol = (coinSymbol: string) => {
        const symbolMap: { [key: string]: string } = {
          'BTC': 'BTCUSDT',
          'ETH': 'ETHUSDT',
          'BNB': 'BNBUSDT',
          'ADA': 'ADAUSDT',
          'DOT': 'DOTUSDT',
          'LINK': 'LINKUSDT',
          'UNI': 'UNIUSDT',
          'AAVE': 'AAVEUSDT',
          'SUSHI': 'SUSHIUSDT',
          'COMP': 'COMPUSDT',
          'DOGE': 'DOGEUSDT',
          'SHIB': 'SHIBUSDT',
          'MATIC': 'MATICUSDT',
          'AVAX': 'AVAXUSDT',
          'SOL': 'SOLUSDT',
          'VYBE': 'BTCUSDT', // Fallback for custom coins
        };
        return symbolMap[coinSymbol] || 'BTCUSDT';
      };

      const symbol = pool ? getSymbol(pool.coinA.symbol) : 'BTCUSDT';

      try {
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: '1',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1a1a1a',
          enable_publishing: false,
          backgroundColor: '#1a1a1a',
          gridColor: '#2a2a2a',
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current.id,
          // Chart overrides for dark theme
          overrides: {
            'paneProperties.background': '#1a1a1a',
            'paneProperties.vertGridProperties.color': '#2a2a2a',
            'paneProperties.horzGridProperties.color': '#2a2a2a',
            'symbolWatermarkProperties.transparency': 90,
            'scalesProperties.textColor': '#ffffff',
            'scalesProperties.backgroundColor': '#1a1a1a',
          },
          studies_overrides: {
            'volume.volume.color.0': '#ff6b6b',
            'volume.volume.color.1': '#00d4aa',
            'volume.volume.transparency': 50,
          },
          loading_screen: {
            backgroundColor: '#1a1a1a',
            foregroundColor: '#00d4aa'
          },
          disabled_features: [
            'use_localstorage_for_settings',
            'volume_force_overlay',
          ],
          enabled_features: [
            'study_templates',
            'side_toolbar_in_fullscreen_mode',
          ],
        });

        console.log('✅ TradingView Professional Widget created for:', symbol);
      } catch (error) {
        console.error('❌ Error creating TradingView widget:', error);
      }
    }

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
          <p className="text-sm">Sol panelden bir pool seçerek profesyonel TradingView grafiğini görüntüleyin</p>
        </div>
      </div>
    );
  }

  const currentPrice = AMMCalculator.getCurrentPrice(pool);
  const priceChange = pool.priceHistory.length > 1 
    ? ((pool.priceHistory[pool.priceHistory.length - 1].close - pool.priceHistory[0].open) / pool.priceHistory[0].open) * 100 
    : 0;

  const getSymbolName = (coinSymbol: string) => {
    const symbolMap: { [key: string]: string } = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum', 
      'BNB': 'Binance Coin',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'AAVE': 'Aave',
      'SUSHI': 'SushiSwap',
      'COMP': 'Compound',
      'DOGE': 'Dogecoin',
      'SHIB': 'Shiba Inu',
      'MATIC': 'Polygon',
      'AVAX': 'Avalanche',
      'SOL': 'Solana',
      'VYBE': 'Bitcoin (VYBE Placeholder)',
    };
    return symbolMap[coinSymbol] || coinSymbol;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      {/* AMM Pool Header */}
      <div className="mb-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {pool.coinA.symbol}/{pool.coinB.symbol} AMM Pool
            </h3>
            <p className="text-sm text-gray-400">
              AMM Price: ${currentPrice.toFixed(6)} 
              <span className={`ml-2 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%)
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">
              ${(pool.reserveA * currentPrice + pool.reserveB).toFixed(0)}
            </div>
            <div className="text-sm text-gray-400">Total Value Locked</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">Volume 24h</div>
            <div className="text-white font-medium">
              ${pool.priceHistory.reduce((sum, point) => sum + point.volume, 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">Total Trades</div>
            <div className="text-white font-medium">
              {pool.priceHistory.length}
            </div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">Pool Ratio</div>
            <div className="text-white font-medium">
              {(pool.reserveA / 1000000).toFixed(1)}M : {(pool.reserveB / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      </div>

      {/* Professional TradingView Chart */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium text-white">
              📊 TradingView Professional - {getSymbolName(pool.coinA.symbol)}
            </span>
          </div>
          {pool.coinA.symbol === 'VYBE' && (
            <span className="text-xs text-yellow-400 bg-yellow-900 bg-opacity-30 px-2 py-1 rounded">
              ⚠️ VYBE is custom - showing BTC data
            </span>
          )}
        </div>
        
        <div 
          ref={containerRef}
          id={`tradingview_${pool.id}`}
          style={{ 
            height: '600px', 
            width: '100%',
            backgroundColor: '#1a1a1a'
          }}
        />
      </div>

      {/* Professional Features Info */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded text-sm">
          <div className="flex items-center space-x-2 text-blue-300">
            <span>🎯</span>
            <div>
              <strong>Professional Features:</strong> Full TradingView experience with technical indicators, 
              drawing tools, multiple timeframes, and real-time market data.
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-green-900 bg-opacity-20 border border-green-700 rounded text-sm">
          <div className="flex items-center space-x-2 text-green-300">
            <span>📊</span>
            <div>
              <strong>AMM vs Market:</strong> Compare your AMM pool performance with real market prices. 
              Your pool has {pool.priceHistory.length} trades worth ${pool.priceHistory.reduce((sum, point) => sum + point.volume, 0).toFixed(0)}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
