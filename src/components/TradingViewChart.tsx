import React, { useEffect, useRef, useState } from 'react';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface TradingViewChartProps {
  pool: Pool | null;
}

// TradingView Widget Script
declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingViewChart({ pool }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [dataProvider, setDataProvider] = useState<any>(null);

  // Load TradingView script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ TradingView script loaded');
      setWidgetReady(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load TradingView script');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Custom Data Provider for our AMM data
  useEffect(() => {
    if (!widgetReady || !pool) return;

    console.log('🚀 Creating TradingView widget for pool:', pool.id);

    // Custom datafeed implementation
    const datafeed = {
      onReady: (callback: any) => {
        console.log('📡 TradingView onReady called');
        setTimeout(() => {
          callback({
            supports_marks: false,
            supports_timescale_marks: false,
            supports_time: true,
            supported_resolutions: ['1', '5', '15', '60', '1D'],
          });
        }, 0);
      },

      searchSymbols: (userInput: string, exchange: string, symbolType: string, onResult: any) => {
        console.log('🔍 searchSymbols called');
        onResult([{
          symbol: `${pool.coinA.symbol}/${pool.coinB.symbol}`,
          full_name: `${pool.coinA.symbol}/${pool.coinB.symbol}`,
          description: `${pool.coinA.name} / ${pool.coinB.name}`,
          exchange: 'AMM',
          type: 'crypto',
        }]);
      },

      resolveSymbol: (symbolName: string, onResolve: any, onError: any) => {
        console.log('🎯 resolveSymbol called for:', symbolName);
        
        const symbolInfo = {
          name: symbolName,
          full_name: symbolName,
          description: `${pool.coinA.name} / ${pool.coinB.name}`,
          type: 'crypto',
          session: '24x7',
          timezone: 'Etc/UTC',
          ticker: symbolName,
          exchange: 'AMM',
          minmov: 1,
          pricescale: 100000000, // 8 decimal places
          has_intraday: true,
          intraday_multipliers: ['1', '5', '15', '60'],
          supported_resolutions: ['1', '5', '15', '60', '1D'],
          volume_precision: 2,
          data_status: 'streaming',
        };

        setTimeout(() => {
          onResolve(symbolInfo);
        }, 0);
      },

      getBars: (symbolInfo: any, resolution: string, periodParams: any, onResult: any, onError: any) => {
        console.log('📊 getBars called:', { symbolInfo: symbolInfo.name, resolution, periodParams });
        
        if (!pool.priceHistory || pool.priceHistory.length === 0) {
          console.log('❌ No price history available');
          onResult([], { noData: true });
          return;
        }

        // Convert our price history to TradingView format
        const bars = pool.priceHistory.map((point, index) => {
          const time = Math.floor(point.timestamp / 1000) * 1000; // Convert to milliseconds
          
          return {
            time: time,
            low: point.low,
            high: point.high,
            open: point.open,
            close: point.close,
            volume: point.volume,
          };
        });

        console.log('📈 Returning', bars.length, 'bars:', bars);
        
        setTimeout(() => {
          onResult(bars, { noData: false });
        }, 0);
      },

      subscribeBars: (symbolInfo: any, resolution: string, onTick: any, listenerGuid: string, onResetCacheNeededCallback: any) => {
        console.log('🔔 subscribeBars called');
        // We'll handle real-time updates here if needed
      },

      unsubscribeBars: (listenerGuid: string) => {
        console.log('🔕 unsubscribeBars called');
      },
    };

    setDataProvider(datafeed);
  }, [widgetReady, pool]);

  // Create TradingView widget
  useEffect(() => {
    if (!widgetReady || !dataProvider || !containerRef.current || !pool) return;

    console.log('🎨 Creating TradingView widget');

    try {
      const widget = new window.TradingView.widget({
        width: '100%',
        height: 400,
        symbol: `${pool.coinA.symbol}/${pool.coinB.symbol}`,
        datafeed: dataProvider,
        interval: '1',
        container: containerRef.current,
        library_path: '/charting_library/',
        locale: 'en',
        disabled_features: [
          'use_localstorage_for_settings',
          'volume_force_overlay',
          'create_volume_indicator_by_default'
        ],
        enabled_features: [
          'study_templates'
        ],
        charts_storage_url: 'https://saveload.tradingview.com',
        charts_storage_api_version: '1.1',
        client_id: 'tradingview.com',
        user_id: 'public_user_id',
        fullscreen: false,
        autosize: true,
        theme: 'dark',
        style: '1',
        toolbar_bg: '#1a1a1a',
        overrides: {
          'paneProperties.background': '#1a1a1a',
          'paneProperties.vertGridProperties.color': '#2a2a2a',
          'paneProperties.horzGridProperties.color': '#2a2a2a',
          'symbolWatermarkProperties.transparency': 90,
          'scalesProperties.textColor': '#ffffff',
        },
        loading_screen: {
          backgroundColor: '#1a1a1a',
          foregroundColor: '#00d4aa'
        },
        custom_css_url: '/tradingview-chart.css',
      });

      console.log('✅ TradingView widget created:', widget);

      widget.onChartReady(() => {
        console.log('🎯 TradingView chart ready!');
      });

      return () => {
        console.log('🧹 Cleaning up TradingView widget');
        if (widget && widget.remove) {
          widget.remove();
        }
      };
    } catch (error) {
      console.error('❌ Error creating TradingView widget:', error);
    }
  }, [widgetReady, dataProvider, pool]);

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

      {/* TradingView Chart Container */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div 
          ref={containerRef}
          style={{ height: '400px', width: '100%' }}
        />
      </div>

      {/* Status */}
      <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
        <div className="flex items-center space-x-4">
          <span className={`flex items-center space-x-2 ${widgetReady ? 'text-green-400' : 'text-yellow-400'}`}>
            <span>{widgetReady ? '✅' : '⏳'}</span>
            <span>TradingView: {widgetReady ? 'Ready' : 'Loading...'}</span>
          </span>
          <span className={`flex items-center space-x-2 ${dataProvider ? 'text-green-400' : 'text-gray-400'}`}>
            <span>{dataProvider ? '✅' : '⏳'}</span>
            <span>DataFeed: {dataProvider ? 'Connected' : 'Waiting...'}</span>
          </span>
          <span className="text-blue-400">
            📊 Data Points: {pool.priceHistory.length}
          </span>
        </div>
      </div>
    </div>
  );
}