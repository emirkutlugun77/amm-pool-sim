import React, { useState } from 'react';
import { X, Coins } from 'lucide-react';
import { useAMM } from '../contexts/AMMContext';

interface CreateCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#F7931A', '#627EEA', '#00D4AA', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
];

export function CreateCoinModal({ isOpen, onClose }: CreateCoinModalProps) {
  const { createCoin } = useAMM();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [totalSupply, setTotalSupply] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !symbol || !totalSupply) {
      setError('Tüm alanları doldurun');
      return;
    }

    const supply = parseFloat(totalSupply);
    if (supply <= 0) {
      setError('Toplam arz 0\'dan büyük olmalı');
      return;
    }

    try {
      createCoin(name, symbol, color, supply);
      setName('');
      setSymbol('');
      setColor(PRESET_COLORS[0]);
      setTotalSupply('');
      onClose();
    } catch (err) {
      setError('Coin oluşturulurken hata oluştu');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-secondary-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Yeni Coin Oluştur</h2>
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
              Coin Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Bitcoin"
              className="w-full px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sembol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Örn: BTC"
              maxLength={6}
              className="w-full px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Renk
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === presetColor
                      ? 'border-white scale-110'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-2 w-full h-10 rounded border border-secondary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Toplam Arz
            </label>
            <input
              type="number"
              value={totalSupply}
              onChange={(e) => setTotalSupply(e.target.value)}
              placeholder="1000000"
              min="1"
              className="w-full px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-secondary-600 rounded-md text-gray-300 hover:bg-secondary-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Coins size={20} />
              <span>Coin Oluştur</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
