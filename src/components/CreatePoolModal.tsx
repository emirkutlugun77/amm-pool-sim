import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useAMM } from '../contexts/AMMContext';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePoolModal({ isOpen, onClose }: CreatePoolModalProps) {
  const { coins, createPool } = useAMM();
  const [coinId, setCoinId] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!coinId || !coinAmount || !usdtAmount) {
      setError('Tüm alanları doldurun');
      return;
    }

    const coinAmountNum = parseFloat(coinAmount);
    const usdtAmountNum = parseFloat(usdtAmount);

    if (coinAmountNum <= 0 || usdtAmountNum <= 0) {
      setError('Miktarlar 0\'dan büyük olmalı');
      return;
    }

    try {
      // Find USDT coin
      const usdtCoin = coins.find(c => c.symbol === 'USDT');
      if (!usdtCoin) {
        setError('USDT coin bulunamadı');
        return;
      }

      // Create pool with selected coin and USDT
      createPool(coinId, usdtCoin.id, coinAmountNum, usdtAmountNum);
      setCoinId('');
      setCoinAmount('');
      setUsdtAmount('');
      onClose();
    } catch (err) {
      setError('Pool oluşturulurken hata oluştu');
    }
  };

  if (!isOpen) return null;

  const selectedCoin = coins.find(c => c.id === coinId);
  const startingPrice = coinAmount && usdtAmount ? 
    (parseFloat(usdtAmount) / parseFloat(coinAmount)).toFixed(8) : '0';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-secondary-900 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Plus size={24} />
            <span>Yeni Pool Oluştur</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Coin Seçin
            </label>
            <select
              value={coinId}
              onChange={(e) => setCoinId(e.target.value)}
              className="w-full px-3 py-2 bg-secondary-800 border border-secondary-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Coin seçin</option>
              {coins.filter(coin => coin.symbol !== 'USDT').map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.symbol} - {coin.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Coin Miktarı
            </label>
            <input
              type="number"
              value={coinAmount}
              onChange={(e) => setCoinAmount(e.target.value)}
              placeholder="Örn: 400000000"
              className="w-full px-3 py-2 bg-secondary-800 border border-secondary-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">Pool'a koyacağınız coin miktarı</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              USDT Miktarı ($)
            </label>
            <input
              type="number"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              placeholder="Örn: 100000"
              className="w-full px-3 py-2 bg-secondary-800 border border-secondary-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">Pool'a koyacağınız dolar miktarı</p>
          </div>

          {selectedCoin && coinAmount && usdtAmount && (
            <div className="bg-secondary-800 p-3 rounded-md">
              <p className="text-xs text-gray-400 mb-1">Başlangıç Fiyatı:</p>
              <p className="text-sm text-white font-medium">
                ${startingPrice} per {selectedCoin.symbol}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Market Cap: ${((parseFloat(coinAmount) / selectedCoin.totalSupply) * selectedCoin.totalSupply * parseFloat(startingPrice)).toLocaleString()}
              </p>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-900 bg-opacity-20 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-secondary-600 text-gray-300 rounded-md hover:bg-secondary-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Pool Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}