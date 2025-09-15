import React, { useState, useEffect } from 'react';
import { Plus, Coins, Settings, Trash2, Edit3, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useAMM } from '../contexts/AMMContext';
import { CreateCoinModal } from './CreateCoinModal';
import { CreatePoolModal } from './CreatePoolModal';
import { StorageManager } from '../utils/storage';
import { CoinMetricsCalculator } from '../utils/coinMetrics';
import { AMMCalculator } from '../utils/amm';

export function CoinList() {
  const { coins, pools, selectedPool, selectPool, getCoinMetrics, transactions, deleteCoin, resetAllData } = useAMM();
  const [showCreateCoin, setShowCreateCoin] = useState(false);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [, forceUpdate] = useState({});

  // Force re-render when pools or transactions change
  useEffect(() => {
    forceUpdate({});
  }, [pools, transactions]);

  const handleDeletePool = (poolId: string) => {
    if (window.confirm('Bu pool\'u silmek istediğinizden emin misiniz?')) {
      const updatedPools = pools.filter(p => p.id !== poolId);
      StorageManager.savePools(updatedPools);
      
      // If deleted pool was selected, clear selection
      if (selectedPool?.id === poolId) {
        selectPool(null);
      }
      
      window.location.reload();
    }
  };

  const handleEditPool = (poolId: string) => {
    // For now, just show an alert. Later can implement edit modal
    alert('Pool düzenleme özelliği yakında eklenecek!');
  };

  const handleDeleteCoin = (coinId: string, coinSymbol: string) => {
    if (coinSymbol === 'USDT') {
      alert('USDT coin\'i silinemez!');
      return;
    }

    if (window.confirm(`${coinSymbol} coin\'ini silmek istediğinizden emin misiniz?`)) {
      try {
        deleteCoin(coinId);
        forceUpdate({});
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Coin silinirken hata oluştu');
      }
    }
  };

  const handleResetAll = () => {
    if (window.confirm('TÜM VERİLERİ SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem:\n- Tüm coinleri\n- Tüm poolları\n- Tüm işlemleri\nsilecek ve sadece USDT bırakacaktır.')) {
      if (window.confirm('Bu işlem GERİ ALINAMAZ! Emin misiniz?')) {
        resetAllData();
        forceUpdate({});
      }
    }
  };

  return (
    <div className="w-80 bg-secondary-900 border-r border-secondary-700 flex flex-col h-screen">
      <div className="p-4 border-b border-secondary-700">
        <h2 className="text-lg font-semibold text-white mb-4">Coin Yönetimi</h2>
        <div className="space-y-2">
          <button
            onClick={() => setShowCreateCoin(true)}
            className="w-full px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Coins size={18} />
            <span>Yeni Coin</span>
          </button>
          <button
            onClick={() => setShowCreatePool(true)}
            className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={18} />
            <span>Yeni Pool</span>
          </button>
          <button
            onClick={handleResetAll}
            className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw size={18} />
            <span>Tümünü Sıfırla</span>
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-secondary-700">
        <h3 className="text-md font-medium text-gray-300 mb-3">Coinler ({coins.length})</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {coins.map((coin) => {
            const metrics = getCoinMetrics(coin.id);
            console.log('Coin metrics for', coin.symbol, ':', metrics);
            return (
              <div
                key={coin.id}
                className="p-3 bg-secondary-800 rounded-md"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: coin.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {coin.symbol}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {coin.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        {CoinMetricsCalculator.formatPrice(metrics.price)}
                      </p>
                      <div className={`text-xs flex items-center space-x-1 ${
                        metrics.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {metrics.priceChange24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        <span>{metrics.priceChange24h >= 0 ? '+' : ''}{metrics.priceChange24h.toFixed(2)}%</span>
                      </div>
                    </div>
                    {coin.symbol !== 'USDT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCoin(coin.id, coin.symbol);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Coin'i sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">MC: </span>
                    <span className="text-white font-medium">
                      {CoinMetricsCalculator.formatLargeNumber(metrics.marketCap)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">FDV: </span>
                    <span className="text-white font-medium">
                      {CoinMetricsCalculator.formatLargeNumber(metrics.fdv)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Vol: </span>
                    <span className="text-white font-medium">
                      {CoinMetricsCalculator.formatLargeNumber(metrics.volume24h)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-4">
        <h3 className="text-md font-medium text-gray-300 mb-3">
          Aktif Poollar ({pools.length})
        </h3>
        <div className="space-y-2 overflow-y-auto">
          {pools.map((pool) => {
            const currentPrice = AMMCalculator.getCurrentPrice(pool);
            const isSelected = selectedPool?.id === pool.id;
            
            return (
              <div
                key={pool.id}
                className={`p-3 rounded-md transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-800 hover:bg-secondary-700 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="flex items-center space-x-2 flex-1 cursor-pointer"
                    onClick={() => selectPool(pool)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pool.coinA.color }}
                    />
                    <span className="text-sm font-medium">
                      {pool.coinA.symbol}
                    </span>
                    <span className="text-xs">/</span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pool.coinB.color }}
                    />
                    <span className="text-sm font-medium">
                      {pool.coinB.symbol}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPool(pool.id);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Pool'u düzenle"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePool(pool.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Pool'u sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Fiyat:</span>
                    <span>{currentPrice.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVL:</span>
                    <span>{(pool.reserveA + pool.reserveB).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rezervler:</span>
                    <span>
                      {pool.reserveA.toFixed(2)} / {pool.reserveB.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {pools.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Settings size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Henüz pool oluşturulmadı</p>
              <p className="text-xs">Yukarıdan yeni pool oluşturun</p>
            </div>
          )}
        </div>
      </div>

      <CreateCoinModal
        isOpen={showCreateCoin}
        onClose={() => setShowCreateCoin(false)}
      />
      
      <CreatePoolModal
        isOpen={showCreatePool}
        onClose={() => setShowCreatePool(false)}
      />
    </div>
  );
}
