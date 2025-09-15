import React, { useEffect, useRef } from 'react';
import { Pool } from '../types';
import { AMMCalculator } from '../utils/amm';

interface AMMTradingViewChartProps {
  pool: Pool | null;
}

// TradingView Widget with custom datafeed for AMM data
declare global {
  interface Window {
    TradingView: any;
  }
}

export function AMMTradingViewChart({ pool }: AMMTradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !pool) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        createCustomChart();
      };
      document.head.appendChild(script);
    } else {
      createCustomChart();
    }

    function createCustomChart() {
      const container = containerRef.current;
      if (!container || !window.TradingView || !pool) {
        console.log('❌ Missing requirements:', {
          container: !!container,
          TradingView: !!window.TradingView,
          pool: !!pool
        });
        return;
      }

      console.log('🚀 Creating AMM TradingView chart for:', pool.coinA.symbol);
      
      // Create a unique container ID
      const containerId = `amm_chart_${pool.id}_${Date.now()}`;
      container.id = containerId;

      // Custom datafeed for AMM data
      const datafeed = {
        onReady: (callback: any) => {
          console.log('📡 AMM Datafeed ready');
          setTimeout(() => {
            callback({
              supports_marks: false,
              supports_timescale_marks: false,
              supports_time: true,
              supported_resolutions: ['1', '5', '15', '60', '1D'],
              supports_group_request: false,
            });
          }, 0);
        },

        searchSymbols: (userInput: string, exchange: string, symbolType: string, onResult: any) => {
          console.log('🔍 AMM searchSymbols called');
          onResult([{
            symbol: `${pool.coinA.symbol}USDT`,
            full_name: `AMM:${pool.coinA.symbol}USDT`,
            description: `${pool.coinA.name} / Tether (AMM Pool)`,
            exchange: 'AMM',
            type: 'crypto',
          }]);
        },

        resolveSymbol: (symbolName: string, onResolve: any, onError: any) => {
          console.log('🎯 AMM resolveSymbol called for:', symbolName);
          
          const symbolInfo = {
            name: symbolName,
            full_name: `AMM:${pool.coinA.symbol}USDT`,
            description: `${pool.coinA.name} / Tether (AMM Pool)`,
            type: 'crypto',
            session: '24x7',
            timezone: 'Etc/UTC',
            ticker: `${pool.coinA.symbol}USDT`,
            exchange: 'AMM',
            minmov: 1,
            pricescale: 100000000, // 8 decimal places for crypto
            has_intraday: true,
            intraday_multipliers: ['1', '5', '15', '60'],
            supported_resolutions: ['1', '5', '15', '60', '1D'],
            volume_precision: 2,
            data_status: 'streaming',
            currency_code: 'USDT',
          };

          setTimeout(() => {
            onResolve(symbolInfo);
          }, 0);
        },

        getBars: (symbolInfo: any, resolution: string, periodParams: any, onResult: any, onError: any) => {
          console.log('📊 AMM getBars called:', { 
            symbol: symbolInfo.name, 
            resolution, 
            from: new Date(periodParams.from * 1000),
            to: new Date(periodParams.to * 1000),
            priceHistoryLength: pool.priceHistory.length
          });
          
          if (!pool.priceHistory || pool.priceHistory.length === 0) {
            console.log('❌ No AMM price history available');
            onResult([], { noData: true });
            return;
          }

          // Convert AMM price history to TradingView bars
          const bars = pool.priceHistory
            .filter(point => {
              const pointTime = Math.floor(point.timestamp / 1000);
              return pointTime >= periodParams.from && pointTime <= periodParams.to;
            })
            .map((point, index) => {
              const time = Math.floor(point.timestamp / 1000);
              
              return {
                time: time * 1000, // TradingView expects milliseconds
                low: point.low,
                high: point.high,
                open: point.open,
                close: point.close,
                volume: point.volume,
              };
            })
            .sort((a, b) => a.time - b.time);

          console.log('📈 Returning AMM bars:', bars.length, 'bars');
          console.log('📊 Sample bar:', bars[0]);
          
          setTimeout(() => {
            onResult(bars, { noData: bars.length === 0 });
          }, 0);
        },

        subscribeBars: (symbolInfo: any, resolution: string, onTick: any, listenerGuid: string, onResetCacheNeededCallback: any) => {
          console.log('🔔 AMM subscribeBars called');
          // Real-time updates would go here
        },

        unsubscribeBars: (listenerGuid: string) => {
          console.log('🔕 AMM unsubscribeBars called');
        },
      };

      try {
        const widget = new window.TradingView.widget({
          width: '100%',
          height: 600,
          symbol: `AMM:${pool.coinA.symbol}USDT`,
          datafeed: datafeed,
          interval: '1',
          container_id: containerId,
          library_path: '/charting_library/',
          locale: 'en',
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            'symbol_search_hot_key',
          ],
          enabled_features: [
            'study_templates',
          ],
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
            'scalesProperties.backgroundColor': '#1a1a1a',
          },
          loading_screen: {
            backgroundColor: '#1a1a1a',
            foregroundColor: '#00d4aa'
          },
        });

        console.log('✅ AMM TradingView widget created');

        widget.onChartReady(() => {
          console.log('🎯 AMM TradingView chart ready!');
        });

      } catch (error) {
        console.error('❌ Error creating AMM TradingView widget:', error);
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
          <p className="text-sm">Sol panelden bir pool seçerek AMM grafiğini görüntüleyin</p>
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
      {/* AMM Pool Header */}
      <div className="mb-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {pool.coinA.symbol}/USDT AMM Pool
            </h3>
            <p className="text-sm text-gray-400">
              Live AMM Trading Data - Your Custom Pool
            </p>
          </div>
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
        
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">Pool TVL</div>
            <div className="text-white font-medium">
              ${(pool.reserveA * currentPrice + pool.reserveB).toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">Volume</div>
            <div className="text-white font-medium">
              ${pool.priceHistory.reduce((sum, point) => sum + point.volume, 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">Trades</div>
            <div className="text-white font-medium">
              {pool.priceHistory.length}
            </div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">24h Change</div>
            <div className={`font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* AMM TradingView Chart */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-white">
              📊 {pool.coinA.symbol}/USDT AMM Live Chart
            </span>
          </div>
          <div className="text-xs text-green-400">
            ✅ Real AMM Data - {pool.priceHistory.length} Trades
          </div>
        </div>
        
        <div 
          ref={containerRef}
          id={`amm_tradingview_${pool.id}`}
          style={{ 
            height: '600px', 
            width: '100%',
            backgroundColor: '#1a1a1a'
          }}
        />
      </div>

      {/* AMM Info */}
      <div className="mt-4 p-3 bg-green-900 bg-opacity-20 border border-green-700 rounded text-sm">
        <div className="flex items-center space-x-2 text-green-300">
          <span>🎯</span>
          <div>
            <strong>AMM Simülasyon Grafiği:</strong> Bu grafik senin {pool.coinA.symbol} coin'inin 
            AMM pool'undaki gerçek trade verilerini TradingView formatında gösteriyor. 
            {pool.priceHistory.length} trade, ${pool.priceHistory.reduce((sum, point) => sum + point.volume, 0).toFixed(2)} volume.
          </div>
        </div>
      </div>
    </div>
  );
}
