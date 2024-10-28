import React, { useState } from 'react';
import { Wallet, Plus, Minus, HardDrive } from 'lucide-react';
import { connectKeplr } from './utils/wallet';

function App() {
  const [years, setYears] = useState(1);
  const [terabytes, setTerabytes] = useState(2);
  const [wallets, setWallets] = useState(['']);
  const [referralCode, setReferralCode] = useState('');
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    try {
      await connectKeplr();
      setConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const addWallet = () => {
    setWallets([...wallets, '']);
  };

  const removeWallet = (index: number) => {
    const newWallets = wallets.filter((_, i) => i !== index);
    setWallets(newWallets);
  };

  const updateWallet = (index: number, value: string) => {
    const newWallets = [...wallets];
    newWallets[index] = value;
    setWallets(newWallets);
  };

  const calculateTotal = () => {
    // Example calculation - adjust based on actual pricing
    const basePrice = 795.195; // JKL per TB per year
    return (basePrice * terabytes * years * wallets.length).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Purchase a storage plan.</h1>
        <p className="text-gray-400 mb-8">
          To get started using Jackal Vault you will need to purchase a storage plan. Storage plans can be
          purchased with JKL. You can purchase storage plans up to 25,520,477,900,000,000 years into the
          future. You'll probably be dead by then!
        </p>

        {!connected ? (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] px-6 py-3 rounded-lg mb-8"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        ) : (
          <div className="bg-[#2a2a2a] p-6 rounded-lg mb-8">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Years</label>
              <input
                type="number"
                min="1"
                value={years}
                onChange={(e) => setYears(Math.max(1, parseInt(e.target.value)))}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Terabytes</label>
              <input
                type="number"
                min="2"
                value={terabytes}
                onChange={(e) => setTerabytes(Math.max(2, parseInt(e.target.value)))}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Wallet Addresses</label>
              {wallets.map((wallet, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={wallet}
                    onChange={(e) => updateWallet(index, e.target.value)}
                    placeholder="jkl1..."
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2"
                  />
                  {index === 0 ? (
                    <button
                      onClick={addWallet}
                      className="p-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => removeWallet(index)}
                      className="p-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-lg"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Referral Code (Optional)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2"
              />
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-lg font-medium">Total</p>
                <p className="text-sm text-gray-400">~${(parseFloat(calculateTotal()) * 0.226).toFixed(2)} USD</p>
              </div>
              <p className="text-2xl font-bold">{calculateTotal()} JKL</p>
            </div>

            <button className="w-full bg-[#e5fb75] hover:bg-[#d5eb65] text-black font-medium py-3 rounded-lg">
              Purchase
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;