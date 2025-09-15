import React from 'react';
import { AdvancedChart } from 'react-tradingview-embed';
import { Pool } from '../types';

interface TradingViewEmbedProps {
  pool: Pool | null;
}

export function TradingViewEmbed({ pool }: TradingViewEmbedProps) {
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

  const widgetProps = {
    symbol: `BINANCE:${pool.coinA.symbol}${pool.coinB.symbol}`,
    interval: '1',
    timezone: 'Europe/Istanbul',
    theme: 'dark',
    style: '1',
    locale: 'tr',
    toolbar_bg: '#1f2937',
    enable_publishing: false,
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    studies: [
      'Volume@tv-basicstudies'
    ],
    backgroundColor: '#1f2937',
    gridColor: '#374151',
    hide_side_toolbar: false,
    allow_symbol_change: false,
    details: true,
    hotlist: true,
    calendar: true,
    show_popup_button: true,
    popup_width: '1000',
    popup_height: '650',
    support_host: 'https://www.tradingview.com'
  };

  return (
    <div className="bg-secondary-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-xl font-bold text-white">
              {pool.coinA.symbol}/{pool.coinB.symbol}
            </h3>
            <div className="text-sm text-gray-400">
              TradingView Professional Chart
            </div>
          </div>
        </div>
      </div>

      {/* TradingView Widget */}
      <div style={{ height: '500px', width: '100%' }}>
        <AdvancedChart widgetProps={widgetProps} />
      </div>
    </div>
  );
}
