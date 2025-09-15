import React, { useState } from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useAMM } from '../contexts/AMMContext';

export function TransactionHistory() {
  const { transactions, pools } = useAMM();
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  
  // Get all transactions sorted by timestamp, filter out invalid ones
  const sortedTransactions = transactions
    .filter(tx => tx && tx.amountIn != null && tx.amountOut != null && tx.price != null)
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter(tx => filter === 'all' || tx.type === filter);

  const getPoolInfo = (poolId: string) => {
    const pool = pools.find(p => p.id === poolId);
    return pool ? `${pool.coinA.symbol}/${pool.coinB.symbol}` : 'Unknown Pool';
  };

  return (
    <div className="bg-secondary-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <Clock size={20} />
          <span>Tüm İşlemler</span>
        </h3>
        
        {/* Filter Buttons */}
        <div className="flex bg-secondary-900 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-secondary-700'
            }`}
          >
            Tümü ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('buy')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'buy'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-secondary-700'
            }`}
          >
            Alım ({transactions.filter(tx => tx.type === 'buy').length})
          </button>
          <button
            onClick={() => setFilter('sell')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'sell'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-secondary-700'
            }`}
          >
            Satım ({transactions.filter(tx => tx.type === 'sell').length})
          </button>
        </div>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-lg">Henüz işlem yapılmadı</p>
          <p className="text-sm">İlk trading işleminizi yaparak başlayın!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 bg-secondary-900 rounded-lg hover:bg-secondary-700 transition-colors">
              <div className="flex items-center space-x-4">
                {/* Transaction Type Icon */}
                <div className={`p-2 rounded-full ${
                  tx.type === 'buy' ? 'bg-green-900' : 'bg-red-900'
                }`}>
                  {tx.type === 'buy' ? (
                    <TrendingUp size={16} className="text-green-400" />
                  ) : (
                    <TrendingDown size={16} className="text-red-400" />
                  )}
                </div>
                
                {/* Transaction Info */}
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className={`text-sm font-bold ${
                      tx.type === 'buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'buy' ? 'BUY' : 'SELL'}
                    </span>
                    <span className="text-sm text-white font-medium">
                      {getPoolInfo(tx.poolId)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-300">
                    {tx.amountIn.toFixed(4)} {tx.tokenIn} → {tx.amountOut.toFixed(4)} {tx.tokenOut}
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(tx.timestamp).toLocaleString('tr-TR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {/* Price & Value */}
              <div className="text-right">
                <div className="text-sm font-semibold text-white mb-1">
                  ${tx.price.toFixed(6)}
                </div>
                <div className="text-xs text-gray-400">
                  Değer: ~${(tx.amountIn * tx.price).toFixed(2)}
                </div>
                <div className="text-xs text-blue-400">
                  ID: {tx.id.slice(-8)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {sortedTransactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-secondary-700 flex justify-between items-center text-sm text-gray-400">
          <span>Toplam {sortedTransactions.length} işlem gösteriliyor</span>
          <span>
            Toplam Hacim: $
            {sortedTransactions.reduce((total, tx) => total + (tx.amountIn * tx.price), 0).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
