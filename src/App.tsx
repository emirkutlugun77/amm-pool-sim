import React from 'react';
import { AMMProvider } from './contexts/AMMContext';
import { CoinList } from './components/CoinList';
import { AMMChart } from './components/AMMChart';
import { TradingInterface } from './components/TradingInterface';
import { MarketStats } from './components/MarketStats';
import { TransactionHistory } from './components/TransactionHistory';
import { useAMM } from './contexts/AMMContext';

function MainContent() {
  const { selectedPool, loading } = useAMM();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            AMM Trading Pool
          </h1>
          <p className="text-gray-400">
            Kendi coinlerinizi oluşturun ve AMM denklemi ile trading yapın
          </p>
        </header>

        {/* Chart and Trading Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Chart - Takes 2/3 width */}
            <div className="lg:col-span-2">
              <AMMChart pool={selectedPool} />
            </div>

          {/* Trading Interface - Takes 1/3 width */}
          <div className="lg:col-span-1">
            <TradingInterface />
          </div>
        </div>

        {/* Market Stats Full Width */}
        <div className="mb-8">
          <MarketStats />
        </div>

        {/* Transaction History */}
        <div className="mt-8">
          <TransactionHistory />
        </div>

        {selectedPool && (
          <div className="mt-8 bg-secondary-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Pool Bilgileri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Pool Yaşı</div>
                <div className="text-lg font-semibold text-white">
                  {Math.floor((Date.now() - selectedPool.createdAt) / (1000 * 60 * 60 * 24))} gün
                </div>
              </div>
              
              <div className="bg-secondary-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">LP Token Arzı</div>
                <div className="text-lg font-semibold text-white">
                  {selectedPool.lpTokenSupply.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-secondary-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">İşlem Sayısı</div>
                <div className="text-lg font-semibold text-white">
                  {selectedPool.priceHistory.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AMMProvider>
      <div className="flex h-screen bg-secondary-900">
        <CoinList />
        <MainContent />
      </div>
    </AMMProvider>
  );
}

export default App;
