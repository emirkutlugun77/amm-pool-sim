import React, { useState, useEffect } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Undo2 } from 'lucide-react';
import { useAMM } from '../contexts/AMMContext';

export function TradingInterface() {
  const { selectedPool, executeSwap, getSwapQuote, undoLastTransaction, canUndo, transactions } = useAMM();
  const [amountIn, setAmountIn] = useState('');
  const [tokenIn, setTokenIn] = useState<'A' | 'B'>('A');
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    if (selectedPool && amountIn && parseFloat(amountIn) > 0) {
      const quoteResult = getSwapQuote(selectedPool.id, parseFloat(amountIn), tokenIn);
      setQuote(quoteResult);
    } else {
      setQuote(null);
    }
  }, [selectedPool, amountIn, tokenIn, getSwapQuote]);

  const handleSwap = () => {
    if (!selectedPool || !amountIn || parseFloat(amountIn) <= 0) return;

    executeSwap(selectedPool.id, parseFloat(amountIn), tokenIn);
    setAmountIn('');
    setQuote(null);
  };

  const handleTokenSwitch = () => {
    setTokenIn(tokenIn === 'A' ? 'B' : 'A');
    setAmountIn('');
    setQuote(null);
  };

  const handleUndo = () => {
    console.log('🔄 Undo button clicked, canUndo:', canUndo, 'transactions:', transactions.length);
    const success = undoLastTransaction();
    console.log('🔄 Undo result:', success);
    if (success) {
      setAmountIn('');
      setQuote(null);
    }
  };

  if (!selectedPool) {
    return (
      <div className="bg-secondary-800 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">💱</div>
          <p className="text-lg">Pool seçin</p>
          <p className="text-sm">Sol taraftan bir pool seçerek trading yapmaya başlayın</p>
        </div>
      </div>
    );
  }

  const tokenInInfo = tokenIn === 'A' ? selectedPool.coinA : selectedPool.coinB;
  const tokenOutInfo = tokenIn === 'A' ? selectedPool.coinB : selectedPool.coinA;
  const reserveIn = tokenIn === 'A' ? selectedPool.reserveA : selectedPool.reserveB;

  return (
    <div className="bg-secondary-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Swap</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>Pool:</span>
            <span className="font-medium text-white">
              {selectedPool.coinA.symbol}/{selectedPool.coinB.symbol}
            </span>
          </div>
          {canUndo && (
            <button
              onClick={handleUndo}
              className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium transition-colors"
              title="Son işlemi geri al"
            >
              <Undo2 size={16} />
              <span>Geri Al</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* From Token */}
        <div className="bg-secondary-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Satacağınız</span>
            <span className="text-xs text-gray-500">
              Rezerv: {reserveIn.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              step="0.01"
              min="0"
              className="flex-1 bg-transparent text-2xl font-semibold text-white placeholder-gray-500 focus:outline-none"
            />
            
            <div className="flex items-center space-x-2 bg-secondary-700 rounded-lg px-3 py-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tokenInInfo.color }}
              />
              <span className="font-medium text-white">{tokenInInfo.symbol}</span>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleTokenSwitch}
            className="bg-secondary-700 hover:bg-secondary-600 rounded-full p-2 transition-colors"
          >
            <ArrowUpDown size={20} className="text-gray-400" />
          </button>
        </div>

        {/* To Token */}
        <div className="bg-secondary-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Alacağınız</span>
            <span className="text-xs text-gray-500">
              Tahmini
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex-1 text-2xl font-semibold text-white">
              {quote ? quote.amountOut.toFixed(6) : '0.0'}
            </div>
            
            <div className="flex items-center space-x-2 bg-secondary-700 rounded-lg px-3 py-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tokenOutInfo.color }}
              />
              <span className="font-medium text-white">{tokenOutInfo.symbol}</span>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="bg-secondary-900 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fiyat Etkisi</span>
              <span className={`font-medium ${
                quote.priceImpact > 5 ? 'text-red-400' : 
                quote.priceImpact > 2 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">İşlem Ücreti</span>
              <span className="text-white">
                {quote.fee.toFixed(6)} {tokenInInfo.symbol}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Yeni Fiyat</span>
              <span className="text-white">
                {quote.newPrice.toFixed(6)} {tokenOutInfo.symbol}/{tokenInInfo.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!amountIn || parseFloat(amountIn) <= 0 || !quote}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            !amountIn || parseFloat(amountIn) <= 0 || !quote
              ? 'bg-secondary-700 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {!amountIn || parseFloat(amountIn) <= 0 ? 'Miktar girin' : 'Swap'}
        </button>
      </div>

      {/* Transaction History */}
      <div className="mt-6 pt-6 border-t border-secondary-700">
        <div className="bg-secondary-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center justify-between">
            <span>İşlem Geçmişi</span>
            <span className="text-xs bg-primary-600 px-2 py-1 rounded">
              {transactions.filter(tx => tx.poolId === selectedPool.id).length}
            </span>
          </h4>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {(() => {
              const poolTransactions = transactions
                .filter(tx => tx.poolId === selectedPool.id)
                .sort((a, b) => b.timestamp - a.timestamp) // En yeni önce
                .slice(0, 20); // Son 20 işlem
              
              if (poolTransactions.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-2xl mb-2">📝</div>
                    <p className="text-sm">Bu pool'da henüz işlem yapılmadı</p>
                    <p className="text-xs">İlk işleminizi yapın!</p>
                  </div>
                );
              }
              
              return poolTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary-800 rounded-lg hover:bg-secondary-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      tx.type === 'buy' ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          tx.type === 'buy' 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {tx.type === 'buy' ? 'BUY' : 'SELL'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(tx.timestamp).toLocaleString('tr-TR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="text-xs text-white mt-1">
                        {tx.amountIn.toFixed(4)} {tx.tokenIn} → {tx.amountOut.toFixed(4)} {tx.tokenOut}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs font-medium text-white">
                      ${tx.price.toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-400">
                      ~${(tx.amountIn * tx.price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
          
          {transactions.filter(tx => tx.poolId === selectedPool.id).length > 20 && (
            <div className="mt-3 pt-3 border-t border-secondary-700 text-center">
              <span className="text-xs text-gray-400">
                Son 20 işlem gösteriliyor
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Trade Buttons */}
      <div className="mt-6 pt-6 border-t border-secondary-700">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setTokenIn('A');
              setAmountIn('100');
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <TrendingUp size={16} />
            <span>Al (100)</span>
          </button>
          
          <button
            onClick={() => {
              setTokenIn('B');
              setAmountIn('100');
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <TrendingDown size={16} />
            <span>Sat (100)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
